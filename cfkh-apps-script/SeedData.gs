var SeedData = (function() {
  function seed(actor) {
    ArticleService.seed_([
      row_('LSF-SOP-023', 'SOP', 'Web Activity Log Review', 'Lightspeed Filter', 'Approved', 'Help Desk · TSD', 'Content Filtering', 'Validate browsing activity, policy context, identity, and escalation evidence before forwarding a filtering issue.', 'web activity, logs, evidence, policy'),
      row_('SS-SOP-001', 'SOP', 'SmartShield Overview', 'SmartShield', 'Approved', 'TSD · School Tech', 'Content Filtering', 'Reference SmartShield enforcement behavior, policy assignment logic, identity paths, and network-level troubleshooting boundaries.', 'smartshield, dns, policy, network'),
      row_('CF-GOV-003', 'Governance Standard', 'SSL Decryption Bypass Governance', 'Lightspeed Filter', 'In Review', 'TSD', 'Governance', 'Operational control standard for evaluating, approving, minimizing, and documenting SSL bypass entries under least-privilege constraints.', 'ssl, bypass, governance, approval'),
      row_('CF-TG-001', 'Troubleshooting Guide', 'Clear Chrome Cache and Retest', 'ChromeOS', 'Approved', 'Help Desk', 'Support Enablement', 'Customer-facing retest workflow for browser and session symptoms before deeper filtering escalation.', 'chrome, cache, retest, session'),
      row_('CF-KB-014', 'Knowledge Article', 'Account or Profile Mismatch', 'ChromeOS', 'Approved', 'Help Desk · School Tech', 'Support Enablement', 'Explains how personal profiles, stale sessions, and identity mismatch can alter filtering outcomes.', 'identity, profile, login, policy'),
      row_('CF-KE-002', 'Known Error', 'Leadership Dashboard Access Limitation', 'Lightspeed Filter', 'Needs Review', 'TSD · Leadership', 'Vendor Management', 'Known role limitation affecting delegated dashboard access, reporting exports, executive visibility, and least-privilege governance.', 'dashboard, roles, least privilege, known error'),
      row_('CF-TG-004', 'Troubleshooting Guide', 'Collect DevTools Evidence', 'Chrome Browser', 'Approved', 'Help Desk · School Tech', 'Support Enablement', 'Evidence collection guide for console, network, HAR, and contextual artifacts before vendor escalation.', 'devtools, har, console, evidence'),
      row_('CF-GOV-007', 'Governance Standard', 'Access Governance and Role Review', 'Admin Console', 'Approved', 'TSD', 'Governance', 'Least-privilege reference for administrative role assignments, dashboard access, operational approval boundaries, and audit evidence.', 'roles, access, governance, review')
    ], actor);
  }

  function row_(id, type, title, system, status, audience, owner, summary, tags) {
    return {
      ArticleID: id,
      Type: type,
      Title: title,
      System: system,
      Status: status,
      Audience: audience,
      Owner: owner,
      Summary: summary,
      Tags: tags,
      SourceReference: '',
      ProcedureNotes: '',
      LastReviewed: status === 'Approved' ? new Date() : '',
      NextReview: '',
      Revision: 1,
      IsArchived: 'FALSE'
    };
  }

  return { seed: seed };
})();
