# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - img "Websiter.click logo" [ref=e5]
      - generic [ref=e7]: websiter.click
    - navigation "Page navigation" [ref=e8]:
      - link "Return to home page" [ref=e9]:
        - /url: /
        - text: Back to Home
  - generic [ref=e11]:
    - generic [ref=e12]:
      - heading "Welcome Back" [level=1] [ref=e13]
      - paragraph [ref=e14]: Sign in to your websiter.click account
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]: Email Address
        - textbox "Email Address" [active] [ref=e18]
      - generic [ref=e19]:
        - generic [ref=e20]: Password
        - textbox "Password" [ref=e21]
      - generic [ref=e22]:
        - generic [ref=e23]:
          - checkbox "Remember me" [ref=e24]
          - generic [ref=e25]: Remember me
        - link "Forgot your password?" [ref=e27]:
          - /url: /forgot-password
      - button "Sign in to your account" [ref=e28]: Sign In
    - paragraph [ref=e30]:
      - text: Don't have an account?
      - link "Sign up" [ref=e31]:
        - /url: /signup
```