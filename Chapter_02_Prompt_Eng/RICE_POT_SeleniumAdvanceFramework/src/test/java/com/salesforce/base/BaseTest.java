package com.salesforce.base;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.BeforeTest;

import com.salesforce.framework.pages.LoginPage;
import com.salesforce.framework.utils.ConfigReader;
import com.salesforce.framework.utils.WaitUtils;

import io.github.bonigarcia.wdm.WebDriverManager;

public class BaseTest {

    protected WebDriver driver;

    protected LoginPage loginPage;

    protected WaitUtils waitUtils;

    protected ConfigReader config;

    @BeforeTest(alwaysRun = true)
    public void setUp() {
        try {
            config = ConfigReader.getInstance();
            driver = createDriver(config.get("browser"));
            waitUtils = new WaitUtils(driver);
        } catch (Exception exception) {
            throw new RuntimeException("WebDriver initialisation failed. " + exception.getMessage(), exception);
        }
    }

    @BeforeMethod(alwaysRun = true)
    public void openLoginPage() {
        try {
            driver.manage().deleteAllCookies();
            driver.manage().window().maximize();
            driver.get(config.get("base.url"));
            loginPage = new LoginPage(driver);
        } catch (Exception exception) {
            throw new RuntimeException("Unable to open the login page. " + exception.getMessage(), exception);
        }
    }

    @AfterTest(alwaysRun = true)
    public void tearDown() {
        try {
            if (driver != null) {
                driver.quit();
            }
        } catch (Exception exception) {
            throw new RuntimeException("WebDriver teardown failed. " + exception.getMessage(), exception);
        } finally {
            driver = null;
        }
    }

    private WebDriver createDriver(String browser) {
        try {
            if ("firefox".equalsIgnoreCase(browser)) {
                WebDriverManager.firefoxdriver().setup();
                return new FirefoxDriver();
            }
            if ("edge".equalsIgnoreCase(browser)) {
                WebDriverManager.edgedriver().setup();
                return new EdgeDriver();
            }
            WebDriverManager.chromedriver().setup();
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--remote-allow-origins=*");
            options.addArguments("--disable-notifications");
            return new ChromeDriver(options);
        } catch (Exception exception) {
            throw new RuntimeException("Unable to launch the browser: " + browser, exception);
        }
    }
}
