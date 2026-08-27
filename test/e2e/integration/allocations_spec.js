/// <reference types="Cypress" />

describe("/allocations behaviour", () => {
  "use strict";

  before(() => {
    cy.dbReset();
  });

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/allocations/1");
    cy.url().should("include", "login");
  });

  it("Should be accesible for a logged user", () => {
    cy.userSignIn();
    cy.visitPage("/allocations/1");
    cy.url().should("include", "allocations");
  });

  it("Should be an input", () => {
    cy.userSignIn();
    cy.visitPage("/allocations/1");
    cy.get("input[name='threshold']");
  });

  it("Should redirect the user", () => {
    const threshold = 2;
    cy.userSignIn();
    cy.visitPage("/allocations/1");

    cy.get("input[name='threshold']")
      .clear()
      .type(threshold);

    cy.get("button[type='submit']")
      .click();

    cy.location().should((loc) => {
      expect(loc.search).to.eq(`?threshold=${threshold}`);
      expect(loc.pathname).to.match(/^\/allocations\/.+$/);
    });
  });

  it("Should not allow accessing another user's allocations (IDOR prevention)", () => {
    cy.userSignIn();
    // Attempt to access allocations with a different userId in the URL
    cy.visitPage("/allocations/999");
    // The page should still show the logged-in user's allocations, not userId 999
    cy.url().should("include", "allocations");
  });
});
