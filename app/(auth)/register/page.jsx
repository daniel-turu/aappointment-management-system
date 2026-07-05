"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { registerPatient } from "@/actions/users"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await registerPatient(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        // Success! Redirect to login
        router.push("/login?registered=true")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg border-zinc-200">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
        <CardDescription>
          Enter your details below to register as a patient
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} method="POST">
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student/Staff ID</Label>
              <Input id="studentId" name="studentId" placeholder="2022/0/00000CT" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@futminna.edu.ng" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" type="tel" placeholder="08012345678" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 mt-2">
          <Button type="submit" className="w-full bg-purple-900 hover:bg-purple-800 text-white" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </Button>
          <div className="text-sm text-center text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-purple-700 hover:underline">
              Sign in here
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
