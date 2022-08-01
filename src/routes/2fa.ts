import axios, { AxiosRequestHeaders } from "axios"

import { defaultConfig, RouteCreator, RouteRegistrator } from "../pkg"

export const get2faRoute: RouteCreator =
  (createHelpers) => async (req, res, next) => {
    res.locals.projectName = "2FA"

    const session = req.session
    console.log(session)

    const to = "+393926967704"
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

    const session = req.session
    console.log(session)

    console.log(req.body)

    return res.redirect(
      process.env.MEXEDIA_PANEL_URL || "https://panel.mexedia.com",
    )
  }

const validate2fa = async (
  token: string,
  code: string,
): Promise<boolean | undefined> => {
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
}

export const register2faRoute: RouteRegistrator = (
  app,
  createHelpers = defaultConfig,
) => {
  app.get("/2fa", get2faRoute(createHelpers))
  app.post("/2fa", post2faRoute(createHelpers))
}
