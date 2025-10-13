"use client";

import { useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const [form, setForm] = useState(
    { 
      username: "",
      firstname: "", 
      lastname: "", 
      email: "", 
      password: "", 
      confirm_password: "", 
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, form);
      alert("Account created! You can now log in.");
      window.location.href = "/login";

    } 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md shadow-lg border border-emerald-200">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-emerald-700">
            Create Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="First Name"
                value={form.firstname}
                onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                required
              />
              <Input
                placeholder="Last Name"
                value={form.lastname}
                onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                required
              />
            </div>
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Password (min 8 chars, 1 number)"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              minLength={8}
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              required
            />

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Creating...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>

            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-600 hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
