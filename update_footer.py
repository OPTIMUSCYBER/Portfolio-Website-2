import os
import glob

html_files = glob.glob("*.html")

socials_html = """          </div>
          <div class="footer-socials">
            <a href="https://linkedin.com/in/harsh" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="mailto:822005harsh@gmail.com" aria-label="Gmail">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </a>
          </div>
        </div>"""

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    target = """          </div>
        </div>"""
    
    # We want to replace the closing tags of footer-sysinfo and footer-brand with the new socials added in between.
    # The actual target in the file:
    #             <div>ROUTING NODE: harsh-portfolio-website.vercel.app</div>
    #           </div>
    #         </div>
    
    actual_target = "            <div>ROUTING NODE: harsh-portfolio-website.vercel.app</div>\n          </div>\n        </div>"
    replacement = "            <div>ROUTING NODE: harsh-portfolio-website.vercel.app</div>\n" + socials_html
    
    if actual_target in content:
        content = content.replace(actual_target, replacement)
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Target not found in {filepath}")
