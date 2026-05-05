export function apiHandler(handlers: any) {
  return async (req: any, res: any) => {
    try {
      const method = req.method

      if (!handlers[method]) {
        return res.status(405).json({
          success: false,
          message: "Method Not Allowed",
        })
      }

      return handlers[method](req, res)
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
}