export function detectHighRiskScenario(query) {
  const highRiskKeywords = [
    'fall',
    'injury',
    'medication error',
    'abuse',
    'neglect',
    'restrictive practice',
    'restraint',
    'unconscious',
    'missing',
    'emergency',
    'choking',
    'bleeding',
    'death',
    'severe',
    'critical',
    'life-threatening',
  ]

  const lowerQuery = query.toLowerCase()
  return highRiskKeywords.some(keyword => lowerQuery.includes(keyword))
}

export function checkRoleScope(role, query) {
  // Placeholder for role-based scope checks
  // In production, this would check if the query is within the user's role scope
  return true
}

export function checkIncidentType(query) {
  const incidentTypes = {
    fall: ['fall', 'fell', 'fallen'],
    medication: ['medication', 'drug', 'medicine', 'overdose'],
    abuse: ['abuse', 'neglect', 'harm', 'assault'],
    aggression: ['aggression', 'aggressive', 'violence', 'violent'],
    missing: ['missing', 'wander', 'abscond'],
    infection: ['infection', 'contagious', 'outbreak'],
    choking: ['choking', 'choked', 'aspirate'],
  }

  const lowerQuery = query.toLowerCase()
  for (const [type, keywords] of Object.entries(incidentTypes)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return type
    }
  }
  return null
}

export function shouldEscalate(query, confidence) {
  const highRisk = detectHighRiskScenario(query)
  const restrictiveKeywords = ['restrain', 'lock', 'restrict', 'chemical restraint', 'physical restraint']
  const hasRestrictive = restrictiveKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  )

  if (hasRestrictive) {
    return true
  }

  if (highRisk && confidence < 0.85) {
    return true
  }

  return confidence < 0.70
}
