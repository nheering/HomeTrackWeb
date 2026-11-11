/**
 * GraphQL-Modul
 * 
 * Dieses Modul exportiert alle GraphQL-Queries und Mutations
 * für die Anwendung.
 */

// Queries
export * from './queries';
export * from './queries-additional';

// Mutations
export * from './mutations';
export * from './mutations-additional';

export default {
  // Queries
  ...require('./queries'),
  ...require('./queries-additional'),
  
  // Mutations
  ...require('./mutations'),
  ...require('./mutations-additional'),
};
