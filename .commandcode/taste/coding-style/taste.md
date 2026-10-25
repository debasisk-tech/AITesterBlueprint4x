# Coding Style

## Test Automation (Selenium / Java)

- Builds Selenium automation with the Page Object Model using PageFactory (`@FindBy`, constructor `PageFactory.initElements(driver, this)`, reusable action methods). Confidence: 0.6
- Uses XPath locators exclusively and avoids CSS selectors plus `By.id()` / `By.name()` / `By.className()` strategies (an `@id` inside an XPath expression is acceptable). Confidence: 0.6
- Rejects `Thread.sleep()`; relies on `WebDriverWait` / explicit and implicit waits for synchronization. Confidence: 0.6
- Uses TestNG annotations (`@Test`, `@BeforeTest`, `@AfterTest`, etc.) with proper setup/teardown logic for test frameworks. Confidence: 0.6
- Wants robust, structured exception handling (try-catch or explicit exception signatures) in both page objects and test scripts rather than swallowed exceptions. Confidence: 0.5
- Prefers no comments in generated source code and treats them as bad practice in deliverable code. Confidence: 0.5
- Targets enterprise / production-grade standards with modular, readable, consistent structure across generated files. Confidence: 0.5
