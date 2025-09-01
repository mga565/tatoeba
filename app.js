const path = require("path");
const express = require("express");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const xss = require("xss-clean");
const hpp = require("hpp");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const passport = require("passport");

const passportSetup = require("./utils/passportInit.js");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//set up middleware
app.use(express.static(path.join(__dirname, "public")));

//global logging middleware
app.use(morgan("dev"));

//data sanitization against nosql query injection
app.use(mongoSanitize());

// //data sanitization against xss
app.use(xss());

//enable CORS with various options
app.use(cors());

app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Disable COEP
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://www.paypal.com",
          "https://www.sandbox.paypal.com",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://cdn.jsdelivr.net",
          "'unsafe-inline'",
        ],
        frameSrc: [
          "'self'",
          "https://www.paypal.com", // Allow PayPal iframes
          "https://www.sandbox.paypal.com", // Allow PayPal sandbox iframe
          "https://www.google.com",
          "https://cdn.jsdelivr.net"
        ],
        imgSrc: [
          "'self'",
          "data:", // Allow inline base64-encoded images
          "https://www.paypalobjects.com", // Allow PayPal images
          "https://www.google.com",
          "https://cdn.jsdelivr.net"
        ],
        connectSrc: [
          "'self'",
          "https://www.paypal.com", // Allow API calls to PayPal
          "https://www.sandbox.paypal.com", // Allow sandbox API connections
          "https://www.google.com",
          "https://cdn.jsdelivr.net"
        ],
        objectSrc: ["'self'", "http://127.0.0.1:3000"], // Allow objects from your local server  http://127.0.0.1:3000,
      },
    },
    frameguard: {
      action: "deny", // Prevents the app from being embedded in iframes
    },
    referrerPolicy: {
      policy: "no-referrer",
    },
    xssFilter: true, // Adds the X-XSS-Protection header to prevent reflected XSS attacks
  })
);

//limit requests from same ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/u", limiter);

//slowing down responses

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per window
  delayMs: () => 500, // Begin adding 500ms of delay per request above 100
});

app.use(speedLimiter);

//for adding body data to request object
app.use(
  express.json({
    limit: "300kb", // limits the size of request data
  })
);

app.use(express.urlencoded({ extended: true, limit: "10kb" }));

//global middleware for adding cookie data to request object
app.use(cookieParser());

//this comes before passport initialisation
app.use(
  cookieSession({
    maxAge: 90 * 24 * 60 * 60 * 1000,
    keys: [process.env.PASSPORT_COOKIE_KEY],
  })
);
//initialise passport
app.use(passport.initialize());

// //use session cookies with passport when authenticating
app.use(passport.session());

app.use((request, response, next) => {
  // console.log("my custom middleware", request.originalUrl, ":", request.body, ":", request.method);
  request.reqTime = Date.now();

  next();
});

//set up routers and routes

app.all(/(.*)/, (request, response, next) => {
  //one way of catching undefined paths
  response.status(400).render("errorpage", {
    data: {
      status: 400,
      message: `cannot find the path: ${request.originalUrl} on this server`,
    },
  });
  next();
});

//export express object
module.exports = app;
/*
1. set up templating engine
2. set up public folder
3. set up required packages
4. set up routes and corresponding routers
5. export the whole app object to be used by spin-up.js
*/
