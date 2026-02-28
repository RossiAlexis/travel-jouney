import React from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { Heading2, Body, Muted } from "../../src/components/Typography";
import { useAuth } from "../../src/hooks/useAuth";
import { spacing } from "../../src/theme/spacing";
import { lightColors } from "../../src/theme/colors";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginForm) {
    try {
      await signIn(data.email, data.password);
      router.replace("/(app)");
    } catch (error) {
      Alert.alert(
        "Sign in failed",
        error instanceof Error
          ? error.message
          : "Please check your credentials and try again.",
      );
    }
  }

  return (
    <ScreenLayout scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Heading2>Welcome back</Heading2>
            <Muted>Sign in to your Bitácora account</Muted>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              size="lg"
              style={styles.submitButton}
            >
              Sign in
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Body style={styles.footerText}>Don't have an account? </Body>
            <Link href="/(auth)/register" asChild>
              <Body style={styles.link}>Sign up</Body>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing[8],
    paddingVertical: spacing[8],
  },
  header: {
    gap: spacing[2],
  },
  form: {
    gap: spacing[4],
  },
  submitButton: {
    marginTop: spacing[2],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: lightColors.mutedForeground,
  },
  link: {
    color: lightColors.primary,
    fontWeight: "500",
  },
});
