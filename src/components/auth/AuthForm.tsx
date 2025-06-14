import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const AuthForm = () => {
	const [email, setEmail] = useState("");
	const [fullName, setFullName] = useState(""); // Added full name state
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		// Pass fullName as user metadata so it gets captured in the profiles table
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${window.location.origin}/`,
				data: { full_name: fullName },
			},
		});

		if (error) {
			toast({
				title: "Sign up failed",
				description: error.message,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Check your email",
				description: "We've sent you a confirmation link to complete your signup.",
			});
		}
		setLoading(false);
	};

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			toast({
				title: "Sign in failed",
				description: error.message,
				variant: "destructive",
			});
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Welcome to Idea Board</CardTitle>
					<CardDescription>
						Join our crowd-sourced idea board to share and discover innovative
						solutions. Find collaborators and get feedback on your ideas.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="signin" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="signin">Sign In</TabsTrigger>
							<TabsTrigger value="signup">Sign Up</TabsTrigger>
						</TabsList>

						<TabsContent value="signin">
							<form onSubmit={handleSignIn} className="space-y-4">
								<div className="space-y-2">
									<Input
										type="email"
										placeholder="Email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
									<Input
										type="password"
										placeholder="Password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
									/>
								</div>
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? "Signing in..." : "Sign In"}
								</Button>
							</form>
						</TabsContent>

						<TabsContent value="signup">
							<form onSubmit={handleSignUp} className="space-y-4">
								<div className="space-y-2">
									<Input
										type="email"
										placeholder="Email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
									<Input
										type="text"
										placeholder="Full Name"
										value={fullName}
										onChange={(e) => setFullName(e.target.value)}
										required
									/>
									<Input
										type="password"
										placeholder="Password (min 6 characters)"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										minLength={6}
									/>
								</div>
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? "Creating account..." : "Create Account"}
								</Button>
							</form>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};

export default AuthForm;
