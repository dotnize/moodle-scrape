import { Cheerio, CheerioAPI, Element, load } from "cheerio";

import { Course, Task, User, Fetch, Options } from "./types/types";

const defaultOptions: Options = {
  refresh: true,
};

const UnixTimestampRate = 1000;

export class Moodle {
  url: string;
  fetch: Fetch;
  cookies: string | undefined;
  user: User | null;
  courses: Array<Course>;
  tasks: Array<Task>;

  /**
   * Creates a new scraper instance for a certain Moodle site
   * @param { Fetch }     fetch   The fetch method to use (e.g. undici or the built-in global fetch)
   * @param { string }    url     URL of the Moodle site
   * @example const moodle = new Moodle(fetch, "https://examplesite.com");
   */
  constructor(fetch: Fetch, url: string) {
    this.fetch = fetch;
    this.url = url.endsWith("/") ? url.slice(0, -1) : url;
    this.cookies = undefined;
    this.user = null;
    this.courses = [];
    this.tasks = [];
  }

  appendToURL(path: string = "") {
    let separator = "/";
    if (path.startsWith(separator) || this.url.endsWith(separator)) {
      separator = "";
    }
    return `${this.url}${separator}${path}`;
  }

  /**
   *
   * @param { string } username
   * @param { string } password
   * @param { Options } options Extra login options
   * @param { boolean } options.refresh  Whether to call Moodle.refresh() automatically after logging in
   * @param { string } options.loginFormPath  If the login form is not located in the url index, this can be set to the form location
   *
   * @example moodle.login('username', 'password', {refresh: true, loginFormPath: 'login/index.php'})
   */
  async login(
    username: string,
    password: string,
    options: Options = defaultOptions
  ) {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    const loginForm = this.appendToURL(options.loginFormPath);

    let res = await this.fetch(loginForm);
    const body = await res.text();
    const $ = load(body);

    form.append("logintoken", $("[name='logintoken']")[0].attribs.value);

    res = await this.fetch(this.appendToURL("/login/index.php"), {
      headers: {
        cookie:
          res.headers
            .get("set-cookie")
            ?.split("Secure, ")
            .find((c: String) => c.startsWith("MoodleSession")) || "",
      },
      method: "POST",
      body: form,
      redirect: "manual",
      credentials: "include",
    });
    this.cookies = res.headers
      .get("set-cookie")
      ?.split("Secure, ")
      .find((c: String) => c.startsWith("MoodleSession"));

    if (this.cookies && options.refresh === true) {
      await this.refresh();
    }
    return !!this.cookies;
  }

  getCourseAndDate(anchors: Cheerio<Element>, $: CheerioAPI) {
    const res: { date?: Date; course?: Course } = {};
    anchors.map((_, el) => {
      if (typeof el.attribs["href"] === "undefined") return;
      const href = el.attribs["href"];
      if (href?.includes("calendar")) {
        const timeParams = href.match(/time=\d*/);
        if (!timeParams || timeParams?.length === 0) return;
        const timeString = timeParams[0].split("=").pop();
        if (!timeString) return;
        res.date = new Date(parseInt(timeString) * UnixTimestampRate);
      }
      if (href?.includes("course")) {
        const courseParams = href.match(/id=\d*/);
        if (!courseParams || courseParams?.length === 0) return;
        const idString = courseParams[0].split("=").pop();
        if (!idString) return;
        res.course = {
          id: parseInt(idString),
          name: $(el).text() || "",
          tasks: [],
        };
      }
    });
    return res;
  }

  /**
   * Fetches the user data and stores them in the Moodle instance
   * @param cookies optional
   */
  async refresh(cookies = this.cookies) {
    const res = await this.fetch(
      `${this.url}/calendar/view.php?view=upcoming`,
      {
        headers: { cookie: cookies || "" },
      }
    );
    const body = await res.text();
    const $ = load(body);
    const courses = new Map<number, Course>();

    try {
      // parse courses
      this.tasks = $(".event")
        .map((_, el) => {
          const description = $(".description-content", el).first().text();
          const anchors = $("a", el);
          const { date, course: retrievedCourse } = this.getCourseAndDate(
            anchors,
            $
          );
          if (!retrievedCourse) return;
          if (!courses.has(retrievedCourse.id)) {
            courses.set(retrievedCourse.id, retrievedCourse);
          }
          const course = courses.get(retrievedCourse.id);
          const task = {
            id: parseInt(el.attribs["data-event-id"]),
            name: el.attribs["data-event-title"],
            description,
            deadline: date,
            // Do we really need to crossreference like this?
            course: course,
          } as Task;
          course?.tasks.push(task);
          return task;
        })
        .toArray();

      this.courses = Array.from(courses.values());

      // parse user
      this.user = {
        id: parseInt(
          $(".theme-loginform-form > a")
            .attr("href")
            ?.split("?id=")[1] as string
        ),
        name: $(".usertext").text(),
        picture: $(".welcome_userpicture").attr("src") as string,
      };

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
