/// <reference types="Cypress" />

describe("/learn behaviour", () => {
  "use strict";

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/learn?url=/dashboard");
    cy.url().should("include", "login");
  });

  it("Should be accesible for a logged user", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=/dashboard");
    cy.url().should("include", "dashboard");
  });

  it("Should redirect to internal paths only", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=/profile");
    cy.url().should("include", "profile");
  });

  it("Should prevent redirect to external URLs", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=https://evil.com");
    cy.url().should("include", "dashboard");
    cy.url().should("not.include", "evil.com");
  });

  it("Should prevent protocol-relative URL redirects", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=//evil.com");
    cy.url().should("include", "dashboard");
    cy.url().should("not.include", "evil.com");
  });

  it("Should default to dashboard when no URL provided", () => {
    cy.userSignIn();
    cy.visitPage("/learn");
    cy.url().should("include", "dashboard");
  });

  it("Should reject paths not in allowlist", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=/nonexistent");
    cy.url().should("include", "dashboard");
  });
});
