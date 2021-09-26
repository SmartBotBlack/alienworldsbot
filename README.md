# Alien Worlds Bot

This bot automatically mines TLM and solves the captcha through the Anti-Captha service.

## Instalation guide

1. Install [NodeJS](https://nodejs.org/).
2. Clone this repository `git clone https://github.com/voodee/alienworldsbot.git`.
3. Go to folder bot `cd alienworldsbot`.
4. Use the command `npm ci` to install the lib.
5. Edit config file `src/config.ts`. Put key from [2captcha](https://2captcha.com/).
6. Build bot from source `npm run build`

## Preparing accounts

1. Installing the [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg?hl=en) extension.
2. Go to [https://all-access.wax.io/](https://all-access.wax.io/).
3. Log in to your account.
4. Copy the cookies and save them to files in the folder `accounts`. For each account, save cookies in a separate file. You can use any file name you like.
5. Land and tools must be selected in each account. The bot does not know how to change this data.

## Additional settings (optional)

1. Create a file `proxies.txt` in the root folder and add proxies there. Proxies must be added in the format `login:password@ip:port`. Each proxy must be added on a new line.

## Running Instructions

After all the dependencies have been downloaded and installed, simply run:

```
npm run mine
```

#### _Any problems? [Submit an issue](https://github.com/voodee/alienworldsbot/issues/new)!_
