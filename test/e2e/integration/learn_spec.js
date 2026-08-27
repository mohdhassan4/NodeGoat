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

  it("Should not redirect to an external URL", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=https://evil.com");
    cy.url().should("not.include", "evil.com");
    cy.url().should("include", "/");
  });

  it("Should not redirect to protocol-relative URLs", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=//evil.com");
    cy.url().should("not.include", "evil.com");
    cy.url().should("include", "/");
  });
});
