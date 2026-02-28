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

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { signUp, isLoading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: RegisterForm) {
    try {
      await signUp(data.email, data.password);
      router.replace("/(app)");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error instanceof Error ? error.message : "Please try again.",
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
            <Heading2>Create account</Heading2>
            <Muted>Start documenting your travel adventures</Muted>
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
                  autoComplete="new-password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm password"
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="new-password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              size="lg"
              style={styles.submitButton}
            >
              Create account
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Body style={styles.footerText}>Already have an account? </Body>
            <Link href="/(auth)/login" asChild>
              <Body style={styles.link}>Sign in</Body>
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
