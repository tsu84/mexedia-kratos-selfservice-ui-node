import { Request, Response } from "express"

import {
  defaultConfig,
  RouteCreator,
  RouteRegistrator,
  setSession,
} from "../pkg"

export const createLogoutRoute: RouteCreator =
  (createHelpers) => async (req, res) => {
    res.locals.projectName = "Mexedia"

    const { sdk } = createHelpers(req)

    // Create a logout URL
    const logoutUrl =
      (
        await sdk
          .createSelfServiceLogoutFlowUrlForBrowsers(req.header("cookie"))
          .catch(() => ({ data: { logout_url: "" } }))
      ).data.logout_url || ""

    res.redirect(logoutUrl)
  }

export const registerLogoutRoute: RouteRegistrator = (
  app,
  createHelpers = defaultConfig,
  route = "/logout",
) => {
  app.get(route, setSession(createHelpers), createLogoutRoute(createHelpers))
}
