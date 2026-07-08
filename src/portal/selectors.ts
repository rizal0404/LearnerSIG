export const loginSelectors = {
  username: 'input[type="email"], input[name="login" i], input[id="login" i], input[name*="login" i], input[id*="login" i], input[name*="email" i], input[name*="user" i], input[id*="email" i], input[id*="user" i]',
  password: 'input[type="password"], input[name="password" i], input[id="password" i], input[name*="password" i], input[id*="password" i]',
  submit: 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Masuk"), button:has-text("Sign in"), button:has-text("Log in")'
} as const;

export const courseSelectors = {
  courseTitle: 'h1, [data-testid*="title" i], .course-title, .title',
  contentItems: '[class*="course" i] li, [class*="content" i] li, [class*="materi" i], [class*="lesson" i], [class*="module" i]',
  video: 'video'
} as const;