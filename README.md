# Frontend-Master-Downloader

[![Greenkeeper badge](https://badges.greenkeeper.io/sepiropht/frontend-master-downloader.svg)](https://greenkeeper.io/)

Download content from frontendmaster with puppeteer

### Usage

**Requirements**

- Node v7.6.0 or greater
- Google Chrome
- ChromeDriver - WebDriver for Chrome

The latest version of Chrome webdriver can be found at link below and the **Setup** instruction can also be found at the same page,

https://sites.google.com/a/chromium.org/chromedriver/downloads

### Setup Chromedriver (macOS)
```sh
cp chromedriver /usr/local/bin/chromedriver
```

# Try it

Checkout the repo then install it

```
npm install frontend-master-downloader -g
```
Use the command by doing

```
frontend-master-downloader -u <USERNAME> -p <PASSWORD> -c <COURSE_NAME> -i <COURSE_ID(optional)> -d <DIRECTORY(optional)>
```
Directory is optional, if not provided, the script will create a Download directory in the current location.

# Example

```
frontend-master-downloader -u sepiropht -p mypassword -c leveldb-crypto

```
