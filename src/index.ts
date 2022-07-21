import { filterNodesByGroups, getNodeLabel } from "@ory/integrations/ui"
import "dotenv/config"
import express, { Request, Response } from "express"
import cors from "cors"
import handlebars from "express-handlebars"
import * as fs from "fs"
import * as https from "https"

import { middleware as middlewareLogger } from "./pkg/logger"
import { toUiNodePartial } from "./pkg/ui"
import {
  register404Route,
  register500Route,
  registerErrorRoute,
  registerHealthRoute,
  registerLoginRoute,
  registerRecoveryRoute,
  registerRegistrationRoute,
  registerSettingsRoute,
  registerStaticRoutes,
  registerVerificationRoute,
  registerWelcomeRoute,
  registerLogoutRoute,
  registerChangePasswordRoute,
} from "./routes"

const app = express()

app.use(cors({
  origin: [/\.mexedia\.com$/, /\.mexediastaging\.com$/, /\.localhost\.$/],
  credentials: true,
}))
app.use(middlewareLogger)
app.use(express.json())
app.set("view engine", "hbs")

app.engine(
  "hbs",
  handlebars({
    extname: "hbs",
    layoutsDir: `${__dirname}/../views/layouts/`,
    partialsDir: `${__dirname}/../views/partials/`,
    defaultLayout: "main",
    helpers: {
      ...require("handlebars-helpers")(),
      jsonPretty: (context: any) => JSON.stringify(context, null, 2),
      onlyNodes: filterNodesByGroups,
      toUiNodePartial,
      getNodeLabel: getNodeLabel,
    },
  }),
)

registerStaticRoutes(app)
registerHealthRoute(app)
registerLoginRoute(app)
registerRecoveryRoute(app)
registerRegistrationRoute(app)
registerSettingsRoute(app)
registerVerificationRoute(app)
registerWelcomeRoute(app)
registerErrorRoute(app)
registerWelcomeRoute(app)
registerLogoutRoute(app)
registerChangePasswordRoute(app)

app.get("/", (req: Request, res: Response) => {
  res.redirect(
    `${process.env.KRATOS_PUBLIC_URL}/self-service/login/browser`,
    303,
  )
})

// app.get('/about', function (req, res)
// {
//   res.render('login');
// }); done

app.get("/code-verification", function (req, res) {
  res.render("verification")
})

// app.get('/recovery_password', function (req, res)
// {
//   res.render('recovery');
// }); done

app.get("/change_password", function (req, res) {
  res.render("change_password")
})


app.get('/template_email', function (req, res)
{
  res.render('template_email');
});

register404Route(app)
register500Route(app)

const port = Number(process.env.PORT) || 3000

let listener = (proto: "http" | "https") => () => {
  console.log(`Listening on ${proto}://0.0.0.0:${port}`)
}

if (process.env.TLS_CERT_PATH?.length && process.env.TLS_KEY_PATH?.length) {
  const options = {
    cert: fs.readFileSync(process.env.TLS_CERT_PATH),
    key: fs.readFileSync(process.env.TLS_KEY_PATH),
  }

  https.createServer(options, app).listen(port, listener("https"))
} else {
  app.listen(port, listener("http"))
}



