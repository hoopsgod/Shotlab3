/**
 * Core ShotLab domain-model typedefs.
 *
 * This file intentionally defines only a small set of stable, high-value
 * entities so we can improve readability and refactor safety without
 * introducing broad churn.
 */

/**
 * @typedef {Object} Player
 * @property {string} email
 * @property {string} name
 */

/**
 * @typedef {Object} Drill
 * @property {number|string} id
 * @property {string} name
 * @property {string} [desc]
 * @property {number} [max]
 * @property {string} [icon]
 */

/**
 * @typedef {Object} TeamBranding
 * @property {string} logoUrl
 * @property {string} teamName
 * @property {string} mascotName
 * @property {string} motto
 * @property {string} primaryColor
 * @property {string} secondaryColor
 * @property {"subtle"|"balanced"|"bold"} brandingMode
 * @property {boolean} showHeaderLogo
 * @property {boolean} showWatermark
 * @property {boolean} useTeamColors
 * @property {boolean} useTeamNameInHeader
 * @property {boolean} watermarkEmptyStates
 * @property {"underline"|"none"} headerAccentStyle
 * @property {"round"|"shield"|"rectangle"} badgeStyle
 * @property {"none"|string} homeTexture
 */

/**
 * @typedef {Object} ScheduledEvent
 * @property {number|string} id
 * @property {string} title
 * @property {string} date
 * @property {string} time
 * @property {string} location
 * @property {string} desc
 * @property {string} type
 * @property {string} teamId
 * @property {number} [createdAt]
 */

export {};
