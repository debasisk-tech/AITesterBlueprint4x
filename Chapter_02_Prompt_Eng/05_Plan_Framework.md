# Plan: Salesforce Login — Enterprise Selenium/Java/Maven/TestNG Framework

## Understanding of the prompt

A RICE-POT code-generation spec. Intent: build an **enterprise-level Selenium + Java + Maven + TestNG
framework** that automates the Salesforce login page (`login.salesforce.com/?locale=in`) and verifies it
with **valid and invalid** test cases.

Mandatory constraints:
- **Page Object Model + PageFactory**: `@FindBy`, constructor `PageFactory.initElements(driver, this)`,
  reusable action methods.
- **TestNG** annotations with real setup/teardown: `@BeforeTest`, `@AfterTest`, `@Test` (+ `@BeforeMethod`).
- **Robust exception handling** in both page objects and test scripts (structured try-catch or explicit
  `throws`). No swallowed exceptions.
- **XPath only.** No `By.cssSelector()`, `By.id()`, `By.name()`, `By.className()`.
- **No comments, no `Thread.sleep()`.** Waits via `WebDriverWait`/`FluentWait` only.
- Output limited to: **1 Page Object file, 2 TestNG test scripts, a Maven project.** No extra explanations.

Core tension: "enterprise-level" needs shared infrastructure (base test, config, wait utils), but the
Output clause names only 3 files. Resolution: build the scaffold so the 3 required files are genuinely
enterprise-grade, and keep the 3 required files as the delivered headline.

## Defaults chosen (clarifications were declined)

1. **Full enterprise scaffold** — BaseTest, ConfigReader, WaitUtils, `config.properties`, `testng.xml` —
   plus the 3 required files + `pom.xml`.
2. **Credentials as placeholders** in `config.properties` (no secrets committed); user fills at run time.
3. **`base.url` configurable**, defaulting to `https://login.salesforce.com/?locale=in`. Production login
   may show CAPTCHA/device-verification that blocks scripted login — use a staging/org URL to run green.
4. **`@id` inside an XPath is allowed** (the prompt's own Example uses `//input[@id='username']`); only
   `By.id/cssSelector/name/className` strategies are banned.

## Target location

Everything lives under `Chapter_02_Prompt_Eng/`:
- Framework code: `Chapter_02_Prompt_Eng/RICE_POT_SeleniumAdvanceFramework/`
- A copy of this plan document: `Chapter_02_Prompt_Eng/05_Plan_Framework.md`
  (sits next to the existing `04_Plan_Framework.md`).

## File tree

```
Chapter_02_Prompt_Eng/
├── 05_Plan_Framework.md                   # this plan document
└── RICE_POT_SeleniumAdvanceFramework/
    ├── pom.xml
    ├── testng.xml
    └── src/
        ├── main/java/com/salesforce/framework/
        │   ├── pages/LoginPage.java          # deliverable 1 — the Page Object
        │   └── utils/
        │       ├── ConfigReader.java          # classpath config loader
        │       └── WaitUtils.java             # WebDriverWait wrapper (no sleep)
        └── test/
            ├── java/com/salesforce/
            │   ├── base/BaseTest.java         # @BeforeTest / @BeforeMethod / @AfterTest
            │   └── tests/
            │       ├── ValidLoginTest.java    # deliverable 2 — valid cases
            │       └── InvalidLoginTest.java  # deliverable 3 — invalid cases
            └── resources/config.properties
```

## Implementation steps

1. **`pom.xml`** — Java 11+, UTF-8. Deps: `selenium-java` 4.x, `testng` 7.x, `webdrivermanager` 5.x.
   `maven-surefire-plugin` wired to `testng.xml`. `com.salesforce:salesforce-login-framework:jar`.
2. **`config.properties`** — `base.url`, `browser`, `explicit.wait`, `error.wait`, `valid.username`,
   `valid.password`, `invalid.username`, `invalid.password` (credential values = placeholders).
3. **`ConfigReader.java`** — singleton, `getResourceAsStream` classpath load; `get`, `getInt`, `getBoolean`;
   missing key/file → throw `RuntimeException` (no silent null).
4. **`WaitUtils.java`** — ctor takes `WebDriver`; `waitForVisibility`, `waitForClickable`,
   `isElementDisplayed`, `waitForUrlContains` — all `WebDriverWait`-based, no sleep.
5. **`LoginPage.java`** (deliverable 1) — `@FindBy(xpath=...)` fields:
   - `//input[@id='username']`, `//input[@id='password']`, `//input[@id='Login']`,
     `//input[@id='rememberUn']`, `//div[@id='error']`.
   - `PageFactory.initElements` in ctor. Actions: `enterUsername`, `enterPassword`, `clickLogin`,
     `clickRememberMe`, `doLogin(String,String)`, `areLoginFieldsDisplayed`, `isRememberMeDisplayed`,
     `isRememberMeSelected`, `isErrorMessageDisplayed`, `getErrorMessageText`, `getCurrentUrl`,
     `getPageTitle`. Each guarded by try-catch rethrowing a descriptive `RuntimeException`; waits via
     `WaitUtils`.
6. **`BaseTest.java`** — protected `driver`, `loginPage`, `waitUtils`, `config`;
   `@BeforeTest` driver init; `@BeforeMethod` cookies + maximize + navigate to `base.url` + init `LoginPage`;
   `@AfterTest(alwaysRun=true)` quit if non-null.
7. **`ValidLoginTest.java`** (deliverable 2) — `loginPageUiElementsDisplayed`, `rememberMeCanBeSelected`,
   `validLoginNavigatesHome`.
8. **`InvalidLoginTest.java`** (deliverable 3) — `invalidPasswordShowsError`, `emptyUsernameShowsError`,
   `emptyPasswordShowsError`, `emptyCredentialsShowsError`, `invalidUsernameFormatShowsError` — each waits
   for the error element and asserts message text.
9. **`testng.xml`** — suite with both test classes.
10. **`05_Plan_Framework.md`** — this document, placed in `Chapter_02_Prompt_Eng/`.

## Style rules enforced while coding

- No comments in `.java`; no `System.out.println`; assertions only.
- No `Thread.sleep`; no implicit+explicit wait mixing.
- Every page action and test body wrapped in try-catch or explicit `throws`.
- Uniform packages, naming, and method ordering across both test classes.

## Verification

1. `mvn -q compile` → zero errors.
2. `mvn test` with placeholders → browser launches, page loads, invalid path exercises the error banner.
   Valid path needs real credentials + a non-CAPTCHA URL.
3. Grep guards (must return nothing): `By\.(cssSelector|id|name|className)`, `Thread\.sleep`,
   line comments in `.java` under `src/main` and `src/test`.
4. Confirm presence of `LoginPage.java`, `ValidLoginTest.java`, `InvalidLoginTest.java`, `pom.xml`,
   and `Chapter_02_Prompt_Eng/05_Plan_Framework.md`.

## Risks

- **CAPTCHA / device verification / SSO** on production `login.salesforce.com` blocks scripted login — point
  `base.url` at a staging/org URL for the valid path.
- Salesforce markup drifts; the xpaths above are stable conventions and may need refresh if the DOM changes.
