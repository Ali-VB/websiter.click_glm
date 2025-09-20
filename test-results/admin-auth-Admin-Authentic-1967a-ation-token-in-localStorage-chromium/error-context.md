# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e5]: websiter.click
    - navigation "Page navigation" [ref=e6]:
      - link "Return to home page" [ref=e7] [cursor=pointer]:
        - /url: /
        - text: Back to Home
  - generic [ref=e9]:
    - generic [ref=e10]:
      - heading "Welcome Back" [level=1] [ref=e11]
      - paragraph [ref=e12]: Sign in to your websiter.click account
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Email Address
        - textbox "Email Address" [ref=e16]
      - generic [ref=e17]:
        - generic [ref=e18]: Password
        - textbox "Password" [ref=e19]
      - generic [ref=e20]:
        - generic [ref=e21]:
          - checkbox "Remember me" [ref=e22]
          - generic [ref=e23]: Remember me
        - link "Forgot your password?" [ref=e25] [cursor=pointer]:
          - /url: /forgot-password
      - button "Sign in to your account" [ref=e26]: Sign In
    - paragraph [ref=e28]:
      - text: Don't have an account?
      - link "Sign up" [ref=e29] [cursor=pointer]:
        - /url: /signup
```