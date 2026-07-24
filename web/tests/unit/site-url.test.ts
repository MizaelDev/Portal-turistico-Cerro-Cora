import assert from "node:assert/strict";
import test from "node:test";
import { siteUrl } from "../../src/lib/utils.ts";

test("usa apenas uma origem HTTP ou HTTPS configurada", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;

  try {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.cerrocorarn.com.br/";
    assert.equal(siteUrl("/gastronomia"), "https://www.cerrocorarn.com.br/gastronomia");

    process.env.NEXT_PUBLIC_SITE_URL = "javascript:alert(1)";
    assert.equal(siteUrl("/gastronomia"), "http://localhost:3000/gastronomia");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test("nao permite que um caminho altere a origem do portal", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;

  try {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.cerrocorarn.com.br";
    assert.equal(
      siteUrl("//example.com/phishing"),
      "https://www.cerrocorarn.com.br/example.com/phishing",
    );
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
