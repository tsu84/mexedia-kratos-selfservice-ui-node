import axios, { AxiosRequestHeaders } from "axios"

interface User {
  phone_number: string
  type: string
  mfa_pass: boolean
}

export const getUser = async (cookies: string): Promise<User | undefined> => {
  try {
    const { data: result } = await axios.get(
      `${process.env.MEXEDIA_API_URL}/me`,
      {
        headers: {
          Cookie: cookies,
          "Content-Type": "application/json",
        } as AxiosRequestHeaders,
      },
    )

    return result.user as User
  } catch (e) {
    console.log(e)
  }
}
