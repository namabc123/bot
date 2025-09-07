import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import App from "./App";

test("renders app without crashing", () => {
  render(<App />);
  // Check if the app renders without throwing an error
  expect(document.body).toBeInTheDocument();
});
