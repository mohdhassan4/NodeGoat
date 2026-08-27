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

  it("Should reject absolute external URLs and redirect to /", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=http://evil.com");
    cy.url().should("not.include", "evil.com");
  });

  it("Should reject protocol-relative URLs and redirect to /", () => {
    cy.userSignIn();
    cy.visitPage("/learn?url=//evil.com");
    cy.url().should("not.include", "evil.com");
  });
});
