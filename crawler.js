const puppeteer = require("puppeteer");
const chalk = require("chalk");
const { msToMin } = require("./utils");
const url = "https://frontendmasters.com";
const SECONDES = 1000;
let stopInterval;

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36";

module.exports = async ({ user, pass, courses, id }) => {
  console.log(chalk.green("You are using frontendmaster-downloader \n"));
  console.log(chalk.green("Try the login ... \n"));
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  const courseTOC = await getCourseTOC()
  await page.goto(url + "/login");

  await page.waitFor(2 * SECONDES);

  await page.waitForSelector("#username");
  const username = await page.$("#username");
  await username.type(user);
  const password = await page.$("#password");
  await password.type(pass);
  const button = await page.$("button");
  //await button.click();
  await Promise.all([
    page.click("button"),
    page.waitForNavigation({ waitUntil: "networkidle0" })
  ]);

  console.log(chalk.green(user + " logged \n"));
  console.log(chalk.green("First scrape all the links... \n"));
  let selector = ".title a";

  await page.goto(url + "/courses");

  await page.waitForSelector(selector);
  const obj = {
    selector,
    courses
  };

  await page.waitFor(3 * SECONDES);
  let link = await page.evaluate(obj => {
    const anchors = Array.from(document.querySelectorAll(obj.selector));
    return anchors
      .map(anchor => {
        return `${anchor.href}`;
      })
      .filter(text => {
        return text.split("/")[4] === obj.courses;
      })
      .pop();
  }, obj);
  await page.goto(link);
  selector = ".LessonListItem a";
  await page.waitForSelector(selector);
  const links = await page.evaluate(selector => {
    const anchors = Array.from(document.querySelectorAll(selector));
    return anchors.map(anchor => {
      return `${anchor.href}`;
    });
  }, selector);
  let finalLinks = [];
  const newLinks = links.map((link, index) => {
    return {
      index,
      link
    };
  });

  if (id) {
    const searchLink = `${url}/courses/${courses}/${id}/`;

    const useLink = newLinks.filter(item => item.link === searchLink)[0];
    const index = useLink.index;
    const link = useLink.link;
    await page.goto(link);
    selector = "video";

    await page.waitFor(8 * SECONDES);
    const videoLink = await page.evaluate(selector => {
      const video = Array.from(document.querySelectorAll(selector)).pop();
      return video.src;
    }, selector);

    const fileName =
      `${index + 1}-` +
      link
        .split("/")
        .filter(str => str.length)
        .pop() +
      ".webm";
    try {
      return [{ fileName, videoLink }];
    } catch (err) {
      console.log("ERROR", err);
    }
  } else {
    finalLinks = await getLinks(newLinks);
    return finalLinks;
  }

  async function getLinks(newLinks) {
    for (const templink of newLinks.slice(0, 3)) {
      console.log(chalk.yellow("scraping :", templink.link + "\n"));
      const { index, link } = templink;
      try {
        await page.goto(link);
      } catch (err) {
        //console.log("erreur, err");
      }
      const selector = "video";

      await page.waitFor(8 * SECONDES);

      //page1.on('console', msg => console.log(msg.text()));
      let videoLink = await page
        .evaluate(selector => {
          const videos = document.querySelectorAll(selector);
          const video = Array.from(videos).pop();
          return video.src;
        }, selector)
        .catch(err => {
          //console.log(err);
          return "retry";
        });
      //console.log("video link fetched", videoLink);
      // console.log(page1.url(), videoLink);

      if (videoLink === "retry" || !videoLink.length) {
        console.log(chalk.red("You have reached maximum request limit \n"));
        console.log(chalk.blue("Sleeping for 15 minutes \n"));
        await timeout(60 * SECONDES * 15);
        clearInterval(stopInterval);
        console.log(chalk.green("End waiting scraping continues !!!! \n"));
        const { index, link } = templink;
        await page.goto(link);
        const selector = "video";

        await page.waitFor(8 * SECONDES);
        videoLink = await page.evaluate(selector => {
          const video = Array.from(document.querySelectorAll(selector)).pop();
          return video.src;
        }, selector);
      }

      const fileName =
        `${index + 1}-` +
        link
          .split("/")
          .filter(str => str.length)
          .pop() +
        ".webm";
      finalLinks.push({ fileName, videoLink });
    }
    return finalLinks;
  }
};
let remainTime;
function timeout(ms) {
  remainTime = ms;
  interval(ms, 1000);
  return new Promise(resolve => setTimeout(resolve, ms));
}

function interval(totalTime, intervalTime) {
  stopInterval = setInterval(loggeRemainingTime, intervalTime);
  function loggeRemainingTime() {
    remainTime = remainTime - intervalTime;
    let time = msToMin(remainTime);
    console.log(chalk.blue(time + "min remaining \n"));
  }
}

async function getCourseTOC(courseId) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  //page.setDefaultNavigationTimeout(0)
  await page.goto(`${url}/courses/${courseId}`);
  //await page.waitForNavigation({ waitUntil: "networkidle0" });
  const title = await page.title();
  console.log(title);
  const lessonGroups = ".lessongroup";
 // await page.waitForSelector(lessonGroups);
 const courseTOC = await page.evaluate(selector => {
    let rank = 0;
    return Array.from(document.querySelectorAll(selector)).map((node, idx) => {
      const chapterTitle = node.textContent;
      const chapterLessons = document
        .querySelector(`${selector}:nth-child(${2 * (idx + 1)}) + .LessonList`)
        .querySelectorAll(".LessonListItem > a");
      return {
        [chapterTitle]: Array.from(chapterLessons).map(link => ({
          title: link.querySelector(".heading h3").textContent,
          url: link.getAttribute("href"),
          rank: ++rank
        })),
        index : idx + 1
      };
    });
  }, lessonGroups);
  await browser.close();
  return courseTOC;
}

//getCourseTOC("programming-language");
require('fs').mkdir('hello/', {recursive: true},(err) =>  {
  if (err) throw err;
  console.log('directory created');
})
