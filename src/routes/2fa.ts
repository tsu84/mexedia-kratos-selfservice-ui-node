import axios, { AxiosRequestHeaders } from "axios"

import { defaultConfig, RouteCreator, RouteRegistrator } from "../pkg"
import { getUser } from "../services/mexedia/user"

export const get2faRoute: RouteCreator =
  (createHelpers) => async (req, res, next) => {
    res.locals.projectName = "2FA"

    const cookie = req.header("Cookie")
    if (!cookie) {
      return res.redirect("login")
    }

    const user = await getUser(cookie)

    if (user === undefined) {
      return res.redirect("login")
    }

    if (user && user.type && user.mfa_pass) {
      return res.redirect("/authenticate")
    }

    const to = user.phone_number
    const message =
      "Mexedia: this is your phone number verification code: {code}"

    const token = await initiate2fa(to, message)

    return res.render("2fa", {
      token,
    })
  }

const initiate2fa = async (
  to: string,
  message: string,
): Promise<string | undefined> => {
  const data = {
    from: "Mexedia",
    to: to,
    text: message,
    codestyle: "Numeric5",
    validityinseconds: process.env.PHONE_CODE_VALIDATION_SECONDS,
    format: "json",
  }
  try {
    const { data: result } = await axios.post(
      `${process.env.ENGY_BASE_PATH}/2fa/initiate`,
      data,
      {
        headers: {
          "X-ApiKey": process.env.ENGY_API_KEY,
        } as AxiosRequestHeaders,
      },
    )
    return result.token
  } catch (e) {
    console.log(e)
  }
}

export const post2faRoute: RouteCreator =
  (createHelpers) => async (req, res, next) => {
    res.locals.projectName = "2FA"

    const cookie = req.header("Cookie")
    if (!cookie) {
      return res.redirect("login")
    }

    const user = await getUser(cookie)

    if (user && user.mfa_pass) {
      return res.redirect("/authenticate")
    }

    const { token, code } = req.body
    const valid = await validate2fa(token, code)

    if (!valid) {
      return res.redirect("/logout")
    }

    return res.redirect("/authenticate")
  }

const validate2fa = async (token: string, code: string): Promise<boolean> => {
  const params = {
    Code: code,
    Token: token,
  }
  try {
    const { data: result } = await axios.post(
      `${process.env.ENGY_BASE_PATH}/2fa/validate`,
      JSON.stringify(params),
      {
        headers: {
          "X-ApiKey": process.env.ENGY_API_KEY,
          "Content-Type": "application/json",
        } as AxiosRequestHeaders,
      },
    )
    return result.valid
  } catch (e) {
    console.log(e)
  }
  return false
}

export const register2faRoute: RouteRegistrator = (
  app,
  createHelpers = defaultConfig,
) => {
  app.get("/2fa", get2faRoute(createHelpers))
  app.post("/2fa", post2faRoute(createHelpers))
}
