import { Page, Protocol, Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import { createCursor, GhostCursor } from "ghost-cursor";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";

type TConfig = {
  maximumNumberOfRunningBrowsers: number;
  captchaKey: string;
};
let config: TConfig | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  config = require("../config.json");
} catch (e) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  config = require("../config.default.json");
}

puppeteer.use(StealthPlugin());
if (config?.captchaKey)
  puppeteer.use(
    // eslint-disable-next-line new-cap
    RecaptchaPlugin({
      provider: {
        id: "2captcha",
        token: config.captchaKey,
      },
    })
  );

const USER_AGENT_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36";
const USER_AGENT_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36";
const USER_AGENT_LINUX =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36";

function getUserAgent() {
  const { platform } = process;
  if (platform === "darwin") {
    return USER_AGENT_MAC;
  }
  if (platform === "win32") {
    return USER_AGENT_WINDOWS;
  }
  return USER_AGENT_LINUX;
}

const args = [
  "--disable-gpu",
  "--no-sandbox",
  "--enable-features=NetworkService,NetworkServiceInProcess",
  "--disable-dev-shm-usage",
  "--disable-infobars",
  "--disable-extensions",
  "--disable-setuid-sandbox",
  "--user-agent=" + getUserAgent(),
  "--ignore-certifcate-errors",
  "--ignore-certifcate-errors-spki-list",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--force-gpu-mem-available-mb=1024",
  "--disable-web-security",
  "--disable-features=site-per-process",
  "--no-default-browser-check",
  "--test-type",
];

const options = {
  args,
  ignoreDefaultArgs: [
    "--enable-automation",
    "--enable-blink-features=IdleDetection",
  ],
  headless: process.env.NODE_ENV !== "development",
  slowMo: 20,
  ignoreHTTPSErrors: true,
};

const pause = (timeout = 5e3) => new Promise((res) => setTimeout(res, timeout));

const random = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

type TMutex = () => Promise<() => void>;
let depth = 0;
const callbacks: ((func: () => void) => void)[] = [];
const updateMutex = () => {
  if (depth < (config?.maximumNumberOfRunningBrowsers ?? 1)) {
    const callback = callbacks.shift();
    if (callback) {
      ++depth;
      callback(() => {
        --depth;
        updateMutex();
      });
    }
  }
};
const mutex: TMutex = () =>
  new Promise((res) => {
    callbacks.push(res);
    updateMutex();
  });

const getPage = async (
  // eslint-disable-next-line @typescript-eslint/ban-types
  options: Object,
  cookies: Protocol.Network.CookieParam[],
  log: (str: string) => void,
  proxyAuth?: string,
  proxyHost?: string
): Promise<{ page: Page; browser: Browser; cursor: GhostCursor }> => {
  log("Browser is waiting in the launch queue");
  const onClose = await mutex();
  log("Browser run");
  if (proxyHost) {
    args.push(`--proxy-server=${proxyHost}`);
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const browser = await puppeteer.launch(options);
  browser.on("disconnected", onClose);

  const page = (await browser.pages())[0];

  if (proxyAuth && proxyHost) {
    const [username, password] = proxyAuth.split(":");
    await page.authenticate({ username, password });
    log(`Use proxy ${proxyAuth}@${proxyHost}`);
  }
  log(`Add cookies`);
  await page.setCookie(...cookies);
  const cursor = createCursor(page);

  await page.goto("https://play.alienworlds.io/", {
    waitUntil: "networkidle2",
    timeout: 0,
  });
  return { page, browser, cursor };
};

const browserSleep = async (
  pauseTime: number,
  oldBrowser: Browser,
  oldPage: Page,
  // eslint-disable-next-line @typescript-eslint/ban-types
  options: Object,
  cookies: Protocol.Network.CookieParam[],
  log: (str: string) => void,
  proxyAuth?: string,
  proxyHost?: string
): Promise<{ page: Page; browser: Browser; cursor: GhostCursor }> => {
  log(`Browser sleep: ${pauseTime / 1000}sec`);

  await oldPage.close();
  await oldBrowser.close();

  await pause(pauseTime);

  const { browser, page, cursor } = await getPage(
    options,
    cookies,
    log,
    proxyAuth,
    proxyHost
  );
  return { page, browser, cursor };
};

const task = async (
  name: string,
  cookies: Protocol.Network.CookieParam[],
  proxy?: string
): Promise<void> => {
  const log = (info: string) => console.log(name + ": " + info);
  log("Run!");

  let proxyAuth, proxyHost;
  if (proxy) {
    [proxyAuth, proxyHost] = proxy.split("@");
  }

  let { browser, page, cursor } = await getPage(
    options,
    cookies,
    log,
    proxyAuth,
    proxyHost
  );
  let numberOfEmptyPasses = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await pause(random(0, 1e4));
      // Проверяем наличие капчи, и если она есть, то решаем её
      const iframes = await page.$$("iframe");
      for (const iframe of iframes) {
        const srcSource = await iframe.getProperty("src");
        if (srcSource) {
          const src: string | null = await srcSource.jsonValue();
          if (src?.includes("hcaptcha")) {
            log("Captcha Detected");
            await page.solveRecaptchas();
            break;
          }
        }
      }
      // ***
      // Проверяем нужно ли войти
      // ***
      const [loginBtnPlace] = await page.$x("//p[contains(., 'Start Now')]");

      let isClickedClaim = false;
      let numberOfClickLogin = 0;

      if (loginBtnPlace !== undefined && numberOfClickLogin <= 3) {
        log("Click Login Page");

        await loginBtnPlace.click();
        await pause(random(0, 4 * 1000));

        numberOfEmptyPasses = 0;
        numberOfClickLogin += 1;
        continue;
      }
      if (numberOfClickLogin > 3) {
        throw new Error("Too many clicks on the login button");
      }

      // ***
      // Проверяем можно ли собрать монеты
      // ***
      const [claimBtn] = await page.$x("//p[contains(., 'Claim Mine')]");

      if (claimBtn !== undefined) {
        log("Get Claim");

        await claimBtn.click();
        isClickedClaim = true;

        const popup: Page = await new Promise((res) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          browser.once("targetcreated", (target) => res(target.page()));
          void cursor.click();
        });

        await popup.waitForSelector(".react-ripples .button");
        const button = await popup.$(".react-ripples .button");

        if (button) {
          log("Approve Wax");
          await button.click();
        }
      }

      // ***
      // Проверяем время
      // ***
      const [nextMine] = await page.$x("//p[contains(., 'Next Mine Attempt')]");

      if (isClickedClaim) {
        try {
          await page.waitForSelector('[aria-live="polite"]', {
            timeout: 120 * 1000,
          });
          const miningBonusEl = await page.$('[aria-live="polite"]');
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const miningBonus: string = await page.evaluate(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
            (element) => element.textContent,
            miningBonusEl
          );
          log(miningBonus);
        } catch {
          //
        }
      }

      if (nextMine !== undefined) {
        log("Waiting to recharge");

        const [, elementMin, elementSes] = await page.$$(
          ".chakra-text:nth-child(1) > span"
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const Min = await page.evaluate(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
          (element) => element.textContent,
          elementMin
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        if (elementMin !== undefined && elementSes !== undefined) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          ({ browser, page, cursor } = await browserSleep(
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            (Min * 60 + 55) * 1000,
            browser,
            page,
            options,
            cookies,
            log,
            proxyAuth,
            proxyHost
          ));

          numberOfEmptyPasses = 0;
          continue;
        }
      }

      // ***
      // Проверяем можно ли майнить
      // ***
      const [mineStartBtn] = await page.$x("//p[contains(., 'Mine')]");

      if (mineStartBtn !== undefined) {
        log("Start Mine");
        await mineStartBtn.click();

        numberOfEmptyPasses = 0;
        continue;
      }

      ++numberOfEmptyPasses;
      if (numberOfEmptyPasses > 20) {
        ({ browser, page, cursor } = await browserSleep(
          random(6e4, 18e4),
          browser,
          page,
          options,
          cookies,
          log,
          proxyAuth,
          proxyHost
        ));

        numberOfEmptyPasses = 0;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      log("Throw Error");
      log(error);

      try {
        const pages = await browser.pages();
        for (const anotherPage of pages) {
          await anotherPage.screenshot({
            type: "png",
            path: `./errors/${new Date().toString()}-${await anotherPage.title()}.png`,
          });
        }
      } catch (e) {
        log("Can't take screenshot");
        console.error(e);
      }

      ({ browser, page, cursor } = await browserSleep(
        1e4,
        browser,
        page,
        options,
        cookies,
        log,
        proxyAuth,
        proxyHost
      ));
      numberOfEmptyPasses = 0;
    }
  }
};

export default task;
