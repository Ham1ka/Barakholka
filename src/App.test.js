import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders application title", () => {
  render(<App />);
  expect(screen.getByText(/Студенческая барахолка/i)).toBeInTheDocument();
});
