import { defaultConfig, RouteCreator, RouteRegistrator } from "../pkg"
import { getUser } from "../services/mexedia/user"

export const checkAuthentication: RouteCreator =
  (createHelpers) => async (req, res, next) => {
    res.locals.projectName = "Check Authentication"

    const cookie = req.header('Cookie')
    if (!cookie) {
      return res.redirect('login')
    }

    const user = await getUser(cookie)

    if (user === undefined) {
      return res.redirect('/login')
    }

    if (user && !user.mfa_pass) {
      return res.redirect("2fa")
    }

    return user && user.type === "admin"
      ? res.redirect(
          process.env.MEXEDIA_ADMIN_URL || "https://admin.mexedia.com",
        )
      : res.redirect(
          process.env.MEXEDIA_PANEL_URL || "https://panel.mexedia.com",
        )
  }

export const registerAuthenticateRoute: RouteRegistrator = (
  app,
  createHelpers = defaultConfig,
) => {
  app.get("/authenticate", checkAuthentication(createHelpers))
}
