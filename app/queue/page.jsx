import { getTodayQueue } from "@/actions/appointments"
import PublicQueueBoard from "@/components/queue/PublicQueueBoard"

export const metadata = {
  title: "Live Clinic Queue Board | FUTMinna Health Centre",
  description: "Real-time student consultation queue and waiting line display."
}

export default async function PublicQueuePage() {
  const initialQueue = await getTodayQueue()

  return <PublicQueueBoard initialQueue={initialQueue} />
}
