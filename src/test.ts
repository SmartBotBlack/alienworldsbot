import puppeteer from "puppeteer-extra";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";

puppeteer.use(
  // eslint-disable-next-line new-cap
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "8d19b37d81678b3bd0c2897c025e6ab3", // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

const args = [
  "--window-size=1680,1220",
  "--disable-gpu",
  "--no-sandbox",
  "--enable-features=NetworkService,NetworkServiceInProcess",
  "--disable-dev-shm-usage",
  "--disable-infobars",
  "--disable-extensions",
  "--disable-setuid-sandbox",
  "--ignore-certifcate-errors",
  "--ignore-certifcate-errors-spki-list",
  // ...
  // "--single-process",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--force-gpu-mem-available-mb=1024",
];

const options = {
  args,
  ignoreDefaultArgs: ["--enable-automation"],
  headless: false,
  slowMo: 120,
  // defaultViewport: null,
  ignoreHTTPSErrors: true,
  // userDataDir: "./tmp",
  defaultViewport: {
    width: 1648,
    height: 1099,
  },
};

void (async () => {
  const browser = await puppeteer.launch(options);

  const page = await browser.newPage();
  await page.goto("http://democaptcha.com/demo-form-eng/hcaptcha.html", {});

  const iframes = await page.$$("iframe");

  for (const iframe of iframes) {
    const srcSource = await iframe.getProperty("src");
    if (srcSource) {
      const src: string = await srcSource.jsonValue();
      if (src?.includes("hcaptcha")) {
        console.log("iframe", src);
        await page.solveRecaptchas();
        break;
      }
    }
  }

  //   for (let i = 0; i < 30; ++i) {
  //     console.log("start " + i);
  //     const page = await browser.newPage();
  //     // const page = (await browser.pages())[0];

  //     page.goto("https://yandex.ru/", {
  //       //   waitUntil: "networkidle2",
  //     });

  //     // await new Promise((res) => setTimeout(res, 1e2));
  //   }

  await new Promise((res) => setTimeout(res, 3e4));
})();
