import { UiNodeInputAttributes } from "@ory/client"

import {
  defaultConfig,
  getUrlForFlow,
  isQuerySet,
  logger,
  redirectOnSoftError,
  requireAuth,
  RouteCreator,
  RouteRegistrator,
} from "../pkg"

export const createChangePasswordRoute: RouteCreator =
  (createHelpers) => (req, res, next) => {
    res.locals.projectName = "Change Password"

    const { return_to = "" } = req.query
    const helpers = createHelpers(req)
    const input = req.body

    if (!input.password) {
      logger.debug("password missing")
    }

    const { sdk, kratosBrowserUrl } = helpers
    // const initFlowUrl = getUrlForFlow(
    //   kratosBrowserUrl,
    //   "settings",
    //   new URLSearchParams({ return_to: return_to.toString() }),
    // )

    return sdk
      .initializeSelfServiceSettingsFlowForBrowsers(return_to.toString(), {
        headers: { Cookie: req.header('Cookie')},
      })
      .then(({ data: flow }) => {
        // Render the data using a view (e.g. Jade Template):
        const csrf_node = flow.ui.nodes.find(
          (n) => (n.attributes as UiNodeInputAttributes).name == "csrf_token",
        )
        if (!csrf_node) {
          throw "csrf_token missing"
        }

        const csrf_token = (csrf_node.attributes as UiNodeInputAttributes).value
        sdk.submitSelfServiceSettingsFlow(flow.id, undefined, {
          csrf_token: csrf_token.value,
          method: "Password",
          password: input.password,
        })

        res.format({
          json: () => res.send("{ message: password updated! }"),
        })
      })
      .catch((e) =>
        res.status(500).format({
          json: () =>
            res.send(`settings flow initialization failed: ${e.message}`),
        }),
      )
  }

export const registerChangePasswordRoute: RouteRegistrator = (
  app,
  createHelpers = defaultConfig,
) => {
  app.post(
    "/password",
    requireAuth(createHelpers),
    createChangePasswordRoute(createHelpers),
  )
}
