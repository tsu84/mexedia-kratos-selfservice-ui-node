import { Request, Response } from "express"

import {
  defaultConfig,
  getUrlForFlow,
  isQuerySet,
  logger,
  redirectOnSoftError,
  removeTrailingSlash,
  RouteCreator,
  RouteRegistrator,
} from "../pkg"

export const createLoginRoute: RouteCreator =
  (createHelpers) => async (req, res, next) => {
    res.locals.projectName = "Accedi"

    const { flow, aal = "", refresh = "", return_to = "" } = req.query
    const helpers = createHelpers(req)
    const { sdk, kratosBrowserUrl } = helpers
    const initFlowUrl = getUrlForFlow(
      kratosBrowserUrl,
      "login",
      new URLSearchParams({
        aal: aal.toString(),
        refresh: refresh.toString(),
        return_to: return_to.toString(),
      }),
    )

    const initRegistrationUrl = getUrlForFlow(
      kratosBrowserUrl,
      "registration",
      new URLSearchParams({
        return_to: return_to.toString(),
      }),
    )

    // The flow is used to identify the settings and registration flow and
    // return data like the csrf_token and so on.
    if (!isQuerySet(flow)) {
      logger.debug("No flow ID found in URL query initializing login flow", {
        query: req.query,
      })
      res.redirect(303, initFlowUrl)
      return
    }

    // It is probably a bit strange to have a logout URL here, however this screen
    // is also used for 2FA flows. If something goes wrong there, we probably want
    // to give the user the option to sign out!
    const logoutUrl =
      (
        await sdk
          .createSelfServiceLogoutFlowUrlForBrowsers(req.header("cookie"))
          .catch(() => ({ data: { logout_url: "" } }))
      ).data.logout_url || ""

    console.log(`cookie ${req.header("cookie")}`)
    return sdk
      .getSelfServiceLoginFlow(flow, req.header("cookie"))
      .then(({ data: flow }) => {
        const recoverUrl =
          process.env.KRATOS_PUBLIC_URL + "/self-service/recovery/browser"
        // Render the data using a view (e.g. Jade Template):
        res.render("login", {
          ...flow,
          isAuthenticated: flow.refresh || flow.requested_aal === "aal2",
          signUpUrl: initRegistrationUrl,
          logoutUrl: logoutUrl,
          recoverUrl: recoverUrl,
        })
      })
      .catch((e) => {
        const getCircularReplacer = () => {
          const seen = new WeakSet()
          return (key: any, value: any) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) {
                return
              }
              seen.add(value)
            }
            return value
          }
        }

        console.log(
          `Error ${e.id}: ${e.message}; Reason: ${e.reason}; Debug: ${e.debug}`,
        )
        console.log(JSON.stringify(e.details, getCircularReplacer(), 4))
        redirectOnSoftError(res, next, initFlowUrl)
      })
  }

export const registerLoginRoute: RouteRegistrator = (
  app,
  createHelpers = defaultConfig,
) => {
  app.get("/login", createLoginRoute(createHelpers))
}
