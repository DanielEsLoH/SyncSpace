# frozen_string_literal: true

# SimpleCov configuration for code coverage analysis
#
# SimpleCov tracks which lines of code are executed during test runs,
# helping identify untested code paths and improve overall test coverage.
#
# Configuration:
# - Minimum coverage: 70% (reasonable for a new project)
# - HTML reports: Generated in coverage/ directory
# - Excludes: Migrations, configuration files, test files
#
# View coverage: Open coverage/index.html in your browser after running tests

SimpleCov.start 'rails' do
  # Minimum coverage percentage required
  minimum_coverage 70

  # Directories to exclude from coverage analysis
  add_filter '/spec/'
  add_filter '/config/'
  add_filter '/db/migrate/'
  add_filter '/vendor/'
  add_filter '/bin/'

  # Groups for better organization in HTML reports
  add_group 'Controllers', 'app/controllers'
  add_group 'Models', 'app/models'
  add_group 'Services', 'app/services'
  add_group 'Mailers', 'app/mailers'
  add_group 'Channels', 'app/channels'
  add_group 'Jobs', 'app/jobs'

  # Track files even if they weren't loaded during test run
  track_files '{app,lib}/**/*.rb'

  # Merge results from multiple test runs
  merge_timeout 3600

  # Format for terminal output
  formatter SimpleCov::Formatter::HTMLFormatter
end
