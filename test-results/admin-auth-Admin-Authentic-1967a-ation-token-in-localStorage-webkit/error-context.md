# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e6]: websiter.click
      - navigation "Page navigation" [ref=e7]:
        - link "Return to home page" [ref=e8]:
          - /url: /
          - text: Back to Home
    - generic [ref=e10]:
      - generic [ref=e11]:
        - heading "Welcome Back" [level=1] [ref=e12]
        - paragraph [ref=e13]: Sign in to your websiter.click account
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Email Address
          - textbox "Email Address" [active] [ref=e17]
        - generic [ref=e18]:
          - generic [ref=e19]: Password
          - textbox "Password" [ref=e20]: admin123
        - generic [ref=e21]:
          - generic [ref=e22]:
            - checkbox "Remember me" [ref=e23]
            - generic [ref=e24]: Remember me
          - link "Forgot your password?" [ref=e26]:
            - /url: /forgot-password
        - button "Sign in to your account" [ref=e27]: Sign In
      - paragraph [ref=e29]:
        - text: Don't have an account?
        - link "Sign up" [ref=e30]:
          - /url: /signup
  - button "Open Next.js Dev Tools" [ref=e36] [cursor=pointer]:
    - img [ref=e37] [cursor=pointer]
  - alert [ref=e42]: Welcome Back
```