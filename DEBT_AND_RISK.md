# Technical Debt Audit

### Item Name: Inconsistent Documentation and Coding Practices
Category: Documentation Debt
Description: Although the prototype does include some forms of documentation, it is often verbose and ill-fitting. Some files include paragraphs of documentation for relatively easy to understand code while others include little to none. Additionally, there exist inconsistencies in coding structure ranging from variable names to file structure that can add confusion when dealing with a team effort.
Remediation Plan: Come up with a set of style guidelines, rework existing documentation, and consider integrating a linter.

### Item Name: Inconsistent Database Management & Usage
Category: Architectural Debt
Description: Although the lovable did create a prototypical database, it’s current schema and RLS doesn’t suit the needs of the current website. Additionally, the prototype uses hard-coded dummy data instead of actually pulling data from the databases. 
Remediation Plan: Refactor the database to better suit the ERD and reconfigure the front end to pull from the actualized database.

### Item Name: Authorization Edge Cases 
Category: Security Debt
Description: We’re currently handling the two user roles, students and business owners, with no nuance. It is only enforced on the frontend with no backend authorization.
Remediation Plan: Enforce authorization in the backend to avoid risk of privilege escalation. Permission depends on role, ownership and status check.

### Item Name: Lack of CD/CI Pipeline
Category: Architectural Debt
Description: We don't currently use a CI/CD pipeline. Manual build and deployments increase risk of errors and makes it harder to update or refactor the code later on.
Remediation Plan: Set up a GitHub Actions pipeline to automate installs, checks, and deployments. Configure automatic deployment to Vercel or Netlify when changes are merged into the main branch, and document the process. Pipeline can be expanded later to include testing and preview builds.

### Item Name: Lack of Error Handling and Testing
Category: Test Debt
Description: The current prototype has no testing at all. This of course means that we currently have no idea how the system will handle errors or abnormal user behavior.
Remediation Plan: Create integration and unit tests for the various components/pages. 

# AI Systems & Risk Management

### Reliability/Hallucination
Currently we plan on using AI to create a personalized recommendation system for consumers and to give business owners smart insights into their storefront’s performance. With this comes the risk that the AI might hallucinate product/services/storefronts that may not actually exist or give nonsensical insights. We plan to mitigate this through safeguards that will verify the AI’s output. When those fail, alternate systems will be relied on as a backup plan. 

### Security Issues
The current iteration of our database does include the storage of sensitive information. Because we plan to give AI access to our database, there is the chance of data leakage either through malicious actors or through poor security. To decrease the chances of this happening, we plan to utilize cybersecurity measures such as principles of least privilege, data obfuscation, and RLS policies among other things to keep users' data secure. 

### Dependency Risk
Although our project is currently depending on the free/low cost tier of the usage of both the Lovable.dev and Open AI API, there is always the chance of future changes to one or both API that may lead to significant overhaul of systems in the future. To lessen the damage of any future changes, we plan to create back up systems for wherever AI is expected to be used to create redundancy in our project.  


# Backlog Integration

### Acceptance Criteria for Readability and Documentation
- Codebase adheres to all team-defined coding standards, including naming conventions, formatting, and file organization
- All refactored code preserves existing functionality with no regression defects introduced
- Code passes all existing unit and integration tests after refactoring
- Necessary documentation is added or updated for all modified files, including:
    - File-level headers describing purpose and responsibility
    - Method or function documentation for public-facing logic
    - Documentation follows the team's approved documentation format and style guidelines
- Code is reviewed and approved by at least one team member or lead
- No linting or static analysis errors remain in the refactored code

### Acceptance Criteria for Testing & Error Handling 
- Unit tests are implemented for all critical business logic and achieve an agreed-upon minimum code coverage threshold (e.g., 80%)
- All unit tests pass successfully in the CI pipeline with no critical or high severity failures
- Integration tests verify correct interaction between all dependent modules, services, APIs, and databases
- Integration tests cover both successful flows and expected failure scenarios
- Manual testing is performed for all major user workflows using documented test cases
- Manual test results are recorded, and any defects are logged and resolved or formally deferred
- No open critical or high severity defects remain at the time of release
- The application runs without crashes or blocking issues in the target environment

### Acceptance Criteria for Proper Database Management & Usage
- The website is successfully connected to the new database using approved connection methods and credentials management
- All previously hardcoded dummy data is removed and replaced with dynamic data retrieved directly from the database
- Data displayed on the website accurately reflects the records stored in the database
- Database queries are optimized and follow team best practices for performance and security
- Error handling is implemented for database connection failures and empty or invalid data responses
- Existing functionality and user workflows continue to operate correctly after the update
- All related unit and integration tests pass with the new database integration
- Manual verification confirms that data updates in the database are reflected on the website without requiring code changes
