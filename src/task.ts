import { Page, Protocol } from "puppeteer";
import puppeteer from "puppeteer-extra";
import { createCursor } from "ghost-cursor";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import Jimp from "jimp/es";

puppeteer.use(StealthPlugin());

const TOLERANCE = 0.1;

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
  "--window-position=0,0",
  // ...
  "--window-size=1680,1220",
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
  // ...
  "--single-process",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--force-gpu-mem-available-mb=1024",
];

let options = {
  args,
  ignoreDefaultArgs: ["--enable-automation"],
  headless: true,
  slowMo: 120,
  // defaultViewport: null,
  ignoreHTTPSErrors: true,
  // userDataDir: "./tmp",
  defaultViewport: {
    width: 1648,
    height: 1099,
  },
};

const pause = (timeout = 5e3) => new Promise((res) => setTimeout(res, timeout));

const random = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
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
    options = {
      ...options,
      args: [...options.args, `--proxy-server=${proxyHost}`],
    };
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const browser = await puppeteer.launch(options);
  // const page = await browser.newPage();
  const page = (await browser.pages())[0];

  // await page.setRequestInterception(true);

  if (proxyAuth && proxyHost) {
    // await page.setExtraHTTPHeaders({
    //   "Proxy-Authorization":
    //     "Basic " + Buffer.from(proxyAuth).toString("base64"),
    // });
    const [username, password] = proxyAuth.split(":");
    await page.authenticate({ username, password });
    log(`Use proxy ${proxyAuth}@${proxyHost}`);
  }
  await page.setCookie(...cookies);
  const cursor = createCursor(page);

  await page.goto("https://play.alienworlds.io/", {
    waitUntil: "networkidle2",
  });
  let numberOfEmptyPasses = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await pause(random(0, 2e4));

      const imageBuffer = (await page.screenshot({
        type: "png",
        fullPage: true,
        // omitBackground: true,
      })) as Buffer;

      const image = await Jimp.read(imageBuffer);
      image.write(`./tmp/${name}.png`);

      // ***
      // Проверяем наличие CPU ошибки
      // ***
      const cpuErrorPlace = image.clone().crop(400, 420 + 25 - 2, 850, 170);
      // cpuErrorPlace.write("assets/cpu-error.png");
      const cpuError = await Jimp.read("./assets/cpu-error.png");

      const distanceCpuError = Jimp.distance(cpuErrorPlace, cpuError);
      const diffCpuError = Jimp.diff(cpuErrorPlace, cpuError).percent;

      // log("CPU error detected", distanceCpuError, diffCpuError);
      if (distanceCpuError < TOLERANCE && diffCpuError < TOLERANCE) {
        log("CPU error detected");

        await cursor.moveTo({
          x: random(1235, 1260),
          y: random(284 + 25 - 2, 310 + 25 - 2),
        });
        await cursor.click();

        const pauseTime = random(60 * 60 * 1000, 60 * 60 * 4 * 1000);
        log(`Pause: ${pauseTime / 1000}sec`);
        await pause(pauseTime);
        continue;
      }

      // ***
      // Проверяем наличие другой CPU ошибки
      // ***
      const cpuError2Place = image.clone().crop(400, 400 + 25 - 2, 850, 170);
      // cpuError2Place.write("assets/cpu-error2.png");
      const cpuError2 = await Jimp.read("./assets/cpu-error2.png");

      const distanceCpuError2 = Jimp.distance(cpuError2Place, cpuError2);
      const diffCpuError2 = Jimp.diff(cpuError2Place, cpuError2).percent;

      // log("CPU error detected2", distanceCpuError2, diffCpuError2);
      if (distanceCpuError2 < TOLERANCE && diffCpuError2 < TOLERANCE) {
        log("CPU error detected");

        await cursor.moveTo({
          x: random(1230, 1265),
          y: random(260 + 25 - 2, 280 + 25 - 2),
        });
        await cursor.click();

        const pauseTime = random(60 * 60 * 1000, 60 * 60 * 4 * 1000);
        log(`Pause: ${pauseTime / 1000}sec`);
        await pause(pauseTime);
        continue;
      }

      // ***
      // Проверяем нужно ли войти
      // ***
      const loginBtnPlace = image.clone().crop(740, 725 + 25 - 2, 160, 65);
      const loginBtn = await Jimp.read("./assets/login-btn.png");

      const distanceLoginBtn = Jimp.distance(loginBtnPlace, loginBtn);
      const diffLoginBtn = Jimp.diff(loginBtnPlace, loginBtn).percent;

      // log("Click Login Page", distanceLoginBtn, diffLoginBtn);
      if (distanceLoginBtn < 0.1 && diffLoginBtn < 0.1) {
        log("Click Login Page");
        await cursor.moveTo({
          x: random(780, 810),
          y: random(730 + 25 - 2, 740 + 25 - 2),
        });
        await cursor.click();
        numberOfEmptyPasses = 0;
        continue;
      }

      // ***
      // Проверяем нужно ли перейти на экран майнинга
      // ***
      const mineBtnPlace = image.clone().crop(1235, 315 + 25 - 2, 250, 55);
      // mineBtnPlace.write("assets/mine-btn.png");
      const mineBtn = await Jimp.read("./assets/mine-btn.png");

      const distanceMineBtn = Jimp.distance(mineBtnPlace, mineBtn);
      const diffMineBtn = Jimp.diff(mineBtnPlace, mineBtn).percent;

      // log("Go to Mine", distanceMineBtn, diffMineBtn);
      if (distanceMineBtn < 0.1 && diffMineBtn < 0.1) {
        log("Go to Mine");
        await cursor.moveTo({
          x: random(1240, 1270),
          y: random(320 + 25 - 2, 335 + 25 - 2),
        });
        await cursor.click();
        numberOfEmptyPasses = 0;
        continue;
      }

      // ***
      // Проверяем можно ли майнить
      // ***
      const mineStartBtnPlace = image.clone().crop(740, 880 + 25 - 2, 160, 45);
      // mineStartBtnPlace.write("assets/mine-start-btn.png");
      const mineStartBtn = await Jimp.read("./assets/mine-start-btn.png");

      const distanceMineStartBtn = Jimp.distance(
        mineStartBtnPlace,
        mineStartBtn
      );
      const diffmineStartBtn = Jimp.diff(
        mineStartBtnPlace,
        mineStartBtn
      ).percent;

      // log("Start Mine", distanceMineStartBtn, diffmineStartBtn);
      if (distanceMineStartBtn < 0.1 && diffmineStartBtn < 0.1) {
        log("Start Mine");
        await cursor.moveTo({
          x: random(745, 760),
          y: random(910 + 25 - 2, 940 + 25 - 2),
        });
        await cursor.click();
        numberOfEmptyPasses = 0;
        continue;
      }

      // ***
      // Проверяем можно ли собрать монеты
      // ***
      const claimOldBtnPlace = image.clone().crop(735, 880 + 25 - 2, 170, 45);
      // claimOldBtnPlace.write("assets/claim-old-btn.png");
      const claimOldBtn = await Jimp.read("./assets/claim-old-btn.png");

      const distanceClaimOldBtn = Jimp.distance(claimOldBtnPlace, claimOldBtn);
      const diffmineClaimOldBtn = Jimp.diff(
        claimOldBtnPlace,
        claimOldBtn
      ).percent;

      // log("Get old Claim", distanceClaimOldBtn, diffmineClaimOldBtn);
      if (distanceClaimOldBtn < 0.1 && diffmineClaimOldBtn < 0.1) {
        log("Get old Claim");
        await cursor.moveTo({
          x: random(740, 780),
          y: random(890 + 25 - 2, 915 + 25 - 2),
        });

        const popup: Page = await new Promise((res) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          browser.once("targetcreated", (target) => res(target.page()));
          void cursor.click();
        });

        await popup.waitForSelector(".react-ripples button");
        const button = await popup.$(".react-ripples button");
        if (button) await button.click();
        log("Approve Wax");

        numberOfEmptyPasses = 0;
        continue;
      }

      // ***
      // После сбора возвращаемся обратно
      // ***
      const backToMiningHubBtnPlace = image
        .clone()
        .crop(320, 805 + 25 - 2, 240, 45);
      // backToMiningHubBtnPlace.write("assets/back-to-mining-hub-btn.png");
      const backToMiningHubBtn = await Jimp.read(
        "./assets/back-to-mining-hub-btn.png"
      );

      const distanceBackToMiningHubBtn = Jimp.distance(
        backToMiningHubBtnPlace,
        backToMiningHubBtn
      );
      const diffClaimBackToMiningHubBtn = Jimp.diff(
        backToMiningHubBtnPlace,
        backToMiningHubBtn
      ).percent;

      // log(
      //   "Back to Mining",
      //   distanceBackToMiningHubBtn,
      //   diffClaimBackToMiningHubBtn
      // );
      if (
        distanceBackToMiningHubBtn < TOLERANCE &&
        diffClaimBackToMiningHubBtn < TOLERANCE
      ) {
        log("Back to Mining");

        await cursor.moveTo({
          x: random(330, 350),
          y: random(815 + 25 - 2, 835 + 25 - 2),
        });

        await cursor.click();

        numberOfEmptyPasses = 0;
        continue;
      }

      // ***
      // Проверяем можно ли собрать монеты
      // ***
      const claimBtnPlace = image.clone().crop(590, 625 + 25 - 2, 170, 40);
      // claimBtnPlace.write("assets/claim-btn.png");
      const claimtBtn = await Jimp.read("./assets/claim-btn.png");

      const distanceClaimBtn = Jimp.distance(claimBtnPlace, claimtBtn);
      const diffClaimBtn = Jimp.diff(claimBtnPlace, claimtBtn).percent;

      // log("Clain", distanceClaimBtn, diffClaimBtn);
      if (distanceClaimBtn < TOLERANCE && diffClaimBtn < TOLERANCE) {
        log("Clain");
        await cursor.moveTo({
          x: random(590, 610),
          y: random(625 + 25 - 2, 645 + 25 - 2),
        });

        const popup: Page = await new Promise((res) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          browser.once("targetcreated", (target) => res(target.page()));
          void cursor.click();
        });

        await popup.waitForSelector(".react-ripples button");
        const button = await popup.$(".react-ripples button");
        if (button) await button.click();
        log("Approve Wax");

        numberOfEmptyPasses = 0;
        continue;
      }

      ++numberOfEmptyPasses;
      if (numberOfEmptyPasses > 20) {
        await page.reload();
        numberOfEmptyPasses = 0;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      log("Throw Error");
      log(error);
      const pages = await browser.pages();
      for (const anotherPage of pages) {
        await anotherPage.screenshot({
          type: "png",
          path: `./errors/${new Date().toString()}-${await anotherPage.title()}.png`,
        });
      }

      await page.reload();
      numberOfEmptyPasses = 0;
    }
  }
};

export default task;
