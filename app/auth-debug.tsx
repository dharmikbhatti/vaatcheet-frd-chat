"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"

export default function AuthDebug() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession()
      setSessionData({ data, error })
      setLoading(false)
    }

    checkSession()
  }, [supabase])

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg max-w-md max-h-80 overflow-auto">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      {loading ? <p>Loading session data...</p> : <pre className="text-xs">{JSON.stringify(sessionData, null, 2)}</pre>}
    </div>
  )
}
