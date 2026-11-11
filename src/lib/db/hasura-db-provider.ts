/**
 * Hasura GraphQL Datenbank-Provider für Nhost
 * 
 * Dieser Provider verwendet die bestehende GraphQL-API von Nhost/Hasura.
 * Er implementiert die DatabaseProvider-Schnittstelle.
 */

import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { gql } from '@apollo/client';
import { config } from '../config';
import type { DatabaseProvider } from './db-provider';
import type {
  Verbrauchstyp,
  CreateVerbrauchstyp,
  UpdateVerbrauchstyp,
  Verbrauchsstelle,
  CreateVerbrauchsstelle,
  UpdateVerbrauchsstelle,
  Anbieter,
  CreateAnbieter,
  UpdateAnbieter,
  Vertrag,
  CreateVertrag,
  UpdateVertrag,
  Preisperiode,
  CreatePreisperiode,
  UpdatePreisperiode,
  Verbrauchswert,
  CreateVerbrauchswert,
  UpdateVerbrauchswert,
  UserSettings,
  CreateUserSettings,
  UpdateUserSettings,
  Handwerker,
  CreateHandwerker,
  UpdateHandwerker,
  Handwerkerrechnung,
  CreateHandwerkerrechnung,
  UpdateHandwerkerrechnung,
  QueryOptions,
  DateRangeFilter,
  AggregationResult,
} from './types';
import { DatabaseError, DatabaseErrorCode, createDatabaseError } from './errors';

// ============================================================
// GraphQL Queries und Mutations
// ============================================================

// Diese Queries/Mutations sind bereits in src/lib/graphql/ definiert
// und werden hier zur besseren Wartbarkeit zentral verwaltet

const GET_VERBRAUCHSTYPEN = gql`
  query GetVerbrauchstypen($user_id: uuid!, $limit: Int, $offset: Int, $order_by: [verbrauchstyp_order_by!]) {
    verbrauchstyp(
      where: { user_id: { _eq: $user_id } }
      limit: $limit
      offset: $offset
      order_by: $order_by
    ) {
      id
      user_id
      name
      einheit
      symbol
      farbe
      bild_url
      erstellt_am
      aktualisiert_am
      verbrauchsstellen(order_by: { bezeichnung: asc }) {
        id
        bezeichnung
        ist_aktiv
        ist_standard
      }
      verbrauchswerte_aggregate {
        aggregate { count }
      }
    }
  }
`;

const GET_VERBRAUCHSTYP_BY_ID = gql`
  query GetVerbrauchstypById($id: uuid!) {
    verbrauchstyp_by_pk(id: $id) {
      id
      user_id
      name
      einheit
      symbol
      farbe
      bild_url
      erstellt_am
      aktualisiert_am
    }
  }
`;

// ============================================================
// HasuraDatabaseProvider Klasse
// ============================================================

export class HasuraDatabaseProvider implements DatabaseProvider {
  private apolloClient: ApolloClient<any>;

  constructor(accessToken?: string) {
    const httpLink = createHttpLink({
      uri: config.nhost.graphqlUrl,
    });

    const authLink = setContext((_, { headers }) => {
      const token = accessToken || this.getAccessToken();
      return {
        headers: {
          ...headers,
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      };
    });

    this.apolloClient = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
      devtools: { enabled: process.env.NODE_ENV === 'development' },
    });
  }

  private getAccessToken(): string | null {
    // Versuche Token aus Nhost zu holen
    try {
      const { createAuthProvider } = require('../auth');
      const auth = createAuthProvider();
      return auth.getAccessToken();
    } catch (error) {
      return null;
    }
  }

  // ============================================================
  // Hilfsfunktionen für GraphQL
  // ============================================================

  private async query<T>(query: any, variables?: any): Promise<T> {
    try {
      const result = await this.apolloClient.query({
        query,
        variables,
        fetchPolicy: 'network-only',
      });
      return result.data as T;
    } catch (error) {
      throw createDatabaseError(error, 'GraphQL Query Error');
    }
  }

  private async mutate<T>(mutation: any, variables?: any): Promise<T> {
    try {
      const result = await this.apolloClient.mutate({
        mutation,
        variables,
      });
      return result.data as T;
    } catch (error) {
      throw createDatabaseError(error, 'GraphQL Mutation Error');
    }
  }

  // ============================================================
  // Mapping-Funktionen
  // ============================================================

  private mapVerbrauchstyp(dbVerbrauchstyp: any): Verbrauchstyp {
    return {
      id: dbVerbrauchstyp.id,
      user_id: dbVerbrauchstyp.user_id,
      name: dbVerbrauchstyp.name,
      einheit: dbVerbrauchstyp.einheit,
      symbol: dbVerbrauchstyp.symbol,
      farbe: dbVerbrauchstyp.farbe,
      bild_url: dbVerbrauchstyp.bild_url,
      erstellt_am: dbVerbrauchstyp.erstellt_am,
      aktualisiert_am: dbVerbrauchstyp.aktualisiert_am,
    };
  }

  private mapVerbrauchsstelle(dbVerbrauchsstelle: any): Verbrauchsstelle {
    return {
      id: dbVerbrauchsstelle.id,
      user_id: dbVerbrauchsstelle.user_id,
      verbrauchstyp_id: dbVerbrauchsstelle.verbrauchstyp_id,
      bezeichnung: dbVerbrauchsstelle.bezeichnung,
      zaehler_nummer: dbVerbrauchsstelle.zaehler_nummer,
      zaehler_typ: dbVerbrauchsstelle.zaehler_typ,
      einbau_datum: dbVerbrauchsstelle.einbau_datum,
      standort: dbVerbrauchsstelle.standort,
      marke_hersteller: dbVerbrauchsstelle.marke_hersteller,
      ist_aktiv: dbVerbrauchsstelle.ist_aktiv,
      ist_standard: dbVerbrauchsstelle.ist_standard,
      notizen: dbVerbrauchsstelle.notizen,
      erstellt_am: dbVerbrauchsstelle.erstellt_am,
      aktualisiert_am: dbVerbrauchsstelle.aktualisiert_am,
    };
  }

  // ============================================================
  // DatabaseProvider Implementation
  // ============================================================

  // Verbrauchstypen
  async getVerbrauchstypen(userId: string, options?: QueryOptions): Promise<Verbrauchstyp[]> {
    const orderBy = options?.orderBy ? [{ [options.orderBy]: options.orderDirection || 'asc' }] : [{ name: 'asc' }];
    
    const data = await this.query<any>(GET_VERBRAUCHSTYPEN, {
      user_id: userId,
      limit: options?.limit,
      offset: options?.offset,
      order_by: orderBy,
    });

    return data.verbrauchstyp.map(this.mapVerbrauchstyp);
  }

  async getVerbrauchstyp(id: string): Promise<Verbrauchstyp | null> {
    const data = await this.query<any>(GET_VERBRAUCHSTYP_BY_ID, { id });
    return data.verbrauchstyp_by_pk ? this.mapVerbrauchstyp(data.verbrauchstyp_by_pk) : null;
  }

  async createVerbrauchstyp(data: CreateVerbrauchstyp): Promise<Verbrauchstyp> {
    // Importiere die Mutation aus dem graphql-Ordner
    const { INSERT_VERBRAUCHSTYP } = require('../graphql/mutations');
    
    const result = await this.mutate<any>(INSERT_VERBRAUCHSTYP, {
      obj: {
        user_id: data.userId,
        name: data.name,
        einheit: data.einheit,
        symbol: data.symbol,
        farbe: data.farbe || '#f97316',
        bild_url: data.bildUrl,
      },
    });

    return this.mapVerbrauchstyp(result.insert_verbrauchstyp_one);
  }

  async updateVerbrauchstyp(id: string, data: UpdateVerbrauchstyp): Promise<Verbrauchstyp> {
    const { UPDATE_VERBRAUCHSTYP } = require('../graphql/mutations');
    
    const result = await this.mutate<any>(UPDATE_VERBRAUCHSTYP, {
      id,
      set: data,
    });

    return this.mapVerbrauchstyp(result.update_verbrauchstyp_by_pk);
  }

  async deleteVerbrauchstyp(id: string): Promise<void> {
    const { DELETE_VERBRAUCHSTYP } = require('../graphql/mutations');
    
    await this.mutate<any>(DELETE_VERBRAUCHSTYP, { id });
  }

  // Verbrauchsstellen
  async getVerbrauchsstellen(userId: string, options?: QueryOptions): Promise<Verbrauchsstelle[]> {
    const { GET_VERBRAUCHSSTELLEN } = require('../graphql/queries-additional');
    
    const data = await this.query<any>(GET_VERBRAUCHSSTELLEN, {
      user_id: userId,
      limit: options?.limit,
      offset: options?.offset,
    });

    return data.verbrauchsstelle.map(this.mapVerbrauchsstelle);
  }

  async getVerbrauchsstellenByTyp(verbrauchstypId: string, options?: QueryOptions): Promise<Verbrauchsstelle[]> {
    const { GET_VERBRAUCHSSTELLEN_BY_TYP } = require('../graphql/queries-additional');
    
    const data = await this.query<any>(GET_VERBRAUCHSSTELLEN_BY_TYP, {
      typ_id: verbrauchstypId,
      limit: options?.limit,
      offset: options?.offset,
    });

    return data.verbrauchsstelle.map(this.mapVerbrauchsstelle);
  }

  async getVerbrauchsstelle(id: string): Promise<Verbrauchsstelle | null> {
    const { GET_VERBRAUCHSSTELLE_BY_ID } = require('../graphql/queries-additional');
    
    const data = await this.query<any>(GET_VERBRAUCHSSTELLE_BY_ID, { id });
    return data.verbrauchsstelle_by_pk ? this.mapVerbrauchsstelle(data.verbrauchsstelle_by_pk) : null;
  }

  async createVerbrauchsstelle(data: CreateVerbrauchsstelle): Promise<Verbrauchsstelle> {
    const { INSERT_VERBRAUCHSSTELLE } = require('../graphql/mutations');
    
    const result = await this.mutate<any>(INSERT_VERBRAUCHSSTELLE, {
      obj: {
        user_id: data.userId,
        verbrauchstyp_id: data.verbrauchstypId,
        bezeichnung: data.bezeichnung,
        zaehler_nummer: data.zaehlerNummer,
        zaehler_typ: data.zaehlerTyp,
        einbau_datum: data.einbauDatum,
        standort: data.standort,
        marke_hersteller: data.markeHersteller,
        ist_aktiv: data.istAktiv !== undefined ? data.istAktiv : true,
        ist_standard: data.istStandard !== undefined ? data.istStandard : false,
        notizen: data.notizen,
      },
    });

    return this.mapVerbrauchsstelle(result.insert_verbrauchsstelle_one);
  }

  async updateVerbrauchsstelle(id: string, data: UpdateVerbrauchsstelle): Promise<Verbrauchsstelle> {
    const { UPDATE_VERBRAUCHSSTELLE } = require('../graphql/mutations');
    
    const result = await this.mutate<any>(UPDATE_VERBRAUCHSSTELLE, {
      id,
      set: data,
    });

    return this.mapVerbrauchsstelle(result.update_verbrauchsstelle_by_pk);
  }

  async deleteVerbrauchsstelle(id: string): Promise<void> {
    const { DELETE_VERBRAUCHSSTELLE } = require('../graphql/mutations');
    
    await this.mutate<any>(DELETE_VERBRAUCHSSTELLE, { id });
  }

  async setStandardVerbrauchsstelle(verbrauchstypId: string, verbrauchsstelleId: string): Promise<void> {
    const { SET_STANDARD_STELLE } = require('../graphql/mutations');
    
    await this.mutate<any>(SET_STANDARD_STELLE, {
      typ_id: verbrauchstypId,
      stelle_id: verbrauchsstelleId,
    });
  }

  // Anbieter, Verträge, Preisperioden, Verbrauchswerte, etc.
  // werden ähnlich implementiert...
  
  // Da die GraphQL-Queries bereits in src/lib/graphql/ definiert sind,
  // können wir diese einfach importieren und verwenden.
  
  // Beispiel für Verbrauchswerte:
  async getVerbrauchswerteByTyp(verbrauchstypId: string, options?: QueryOptions & DateRangeFilter): Promise<Verbrauchswert[]> {
    const { GET_VERBRAUCHSWERTE_BY_TYP } = require('../graphql/queries-additional');
    
    const data = await this.query<any>(GET_VERBRAUCHSWERTE_BY_TYP, {
      typ_id: verbrauchstypId,
      start_date: options?.startDate,
      end_date: options?.endDate,
      limit: options?.limit,
      offset: options?.offset,
    });

    return data.verbrauchswert.map((v: any) => ({
      id: v.id,
      user_id: v.user_id,
      verbrauchstyp_id: v.verbrauchstyp_id,
      verbrauchsstelle_id: v.verbrauchsstelle_id,
      datum: v.datum,
      zaehlerstand: v.zaehlerstand,
      verbrauch: v.verbrauch,
      bild_url: v.bild_url,
      notizen: v.notizen,
      erstellt_am: v.erstellt_am,
      aktualisiert_am: v.aktualisiert_am,
    }));
  }

  async getLastVerbrauchswert(verbrauchstypId: string, verbrauchsstelleId: string, date: string): Promise<Verbrauchswert | null> {
    const { GET_LETZTER_VERBRAUCHSWERT } = require('../graphql/queries');
    
    const data = await this.query<any>(GET_LETZTER_VERBRAUCHSWERT, {
      typ_id: verbrauchstypId,
      stelle_id: verbrauchsstelleId,
      datum: date,
    });

    if (data.verbrauchswert.length === 0) {
      return null;
    }

    const v = data.verbrauchswert[0];
    return {
      id: v.id,
      user_id: v.user_id,
      verbrauchstyp_id: v.verbrauchstyp_id,
      verbrauchsstelle_id: v.verbrauchsstelle_id,
      datum: v.datum,
      zaehlerstand: v.zaehlerstand,
      verbrauch: v.verbrauch,
      bild_url: v.bild_url,
      notizen: v.notizen,
      erstellt_am: v.erstellt_am,
      aktualisiert_am: v.aktualisiert_am,
    };
  }

  async getPreviousVerbrauchswert(verbrauchstypId: string, verbrauchsstelleId: string, date: string, excludeId: string): Promise<Verbrauchswert | null> {
    const { GET_VORHERIGER_VERBRAUCHSWERT } = require('../graphql/queries');
    
    const data = await this.query<any>(GET_VORHERIGER_VERBRAUCHSWERT, {
      typ_id: verbrauchstypId,
      stelle_id: verbrauchsstelleId,
      datum: date,
      exclude_id: excludeId,
    });

    if (data.verbrauchswert.length === 0) {
      return null;
    }

    const v = data.verbrauchswert[0];
    return {
      id: v.id,
      user_id: v.user_id,
      verbrauchstyp_id: v.verbrauchstyp_id,
      verbrauchsstelle_id: v.verbrauchsstelle_id,
      datum: v.datum,
      zaehlerstand: v.zaehlerstand,
      verbrauch: v.verbrauch,
      bild_url: v.bild_url,
      notizen: v.notizen,
      erstellt_am: v.erstellt_am,
      aktualisiert_am: v.aktualisiert_am,
    };
  }

  async createVerbrauchswert(data: CreateVerbrauchswert): Promise<Verbrauchswert> {
    const { INSERT_VERBRAUCHSWERT } = require('../graphql/mutations');
    
    const result = await this.mutate<any>(INSERT_VERBRAUCHSWERT, {
      obj: {
        user_id: data.userId,
        verbrauchstyp_id: data.verbrauchstypId,
        verbrauchsstelle_id: data.verbrauchsstelleId,
        datum: data.datum,
        zaehlerstand: data.zaehlerstand,
        verbrauch: data.verbrauch,
        bild_url: data.bildUrl,
        notizen: data.notizen,
      },
    });

    const v = result.insert_verbrauchswert_one;
    return {
      id: v.id,
      user_id: v.user_id,
      verbrauchstyp_id: v.verbrauchstyp_id,
      verbrauchsstelle_id: v.verbrauchsstelle_id,
      datum: v.datum,
      zaehlerstand: v.zaehlerstand,
      verbrauch: v.verbrauch,
      bild_url: v.bild_url,
      notizen: v.notizen,
      erstellt_am: v.erstellt_am,
      aktualisiert_am: v.aktualisiert_am,
    };
  }

  async updateVerbrauchswert(id: string, data: UpdateVerbrauchswert): Promise<Verbrauchswert> {
    const { UPDATE_VERBRAUCHSWERT } = require('../graphql/mutations');
    
    const result = await this.mutate<any>(UPDATE_VERBRAUCHSWERT, {
      id,
      set: data,
    });

    const v = result.update_verbrauchswert_by_pk;
    return {
      id: v.id,
      user_id: v.user_id,
      verbrauchstyp_id: v.verbrauchstyp_id,
      verbrauchsstelle_id: v.verbrauchsstelle_id,
      datum: v.datum,
      zaehlerstand: v.zaehlerstand,
      verbrauch: v.verbrauch,
      bild_url: v.bild_url,
      notizen: v.notizen,
      erstellt_am: v.erstellt_am,
      aktualisiert_am: v.aktualisiert_am,
    };
  }

  async deleteVerbrauchswert(id: string): Promise<void> {
    const { DELETE_VERBRAUCHSWERT } = require('../graphql/mutations');
    
    await this.mutate<any>(DELETE_VERBRAUCHSWERT, { id });
  }

  // ============================================================
  // User Settings
  // ============================================================

  async getUserSetting(userId: string, key: string): Promise<UserSettings | null> {
    const { GET_USER_SETTING } = require('../graphql/queries-additional');
    
    const data = await this.query<any>(GET_USER_SETTING, {
      user_id: userId,
      key,
    });

    if (data.user_settings.length === 0) {
      return null;
    }

    const s = data.user_settings[0];
    return {
      id: s.id,
      user_id: s.user_id,
      key: s.key,
      value: s.value,
      erstellt_am: s.erstellt_am,
      aktualisiert_am: s.aktualisiert_am,
    };
  }

  async getUserSettings(userId: string): Promise<UserSettings[]> {
    const { GET_USER_SETTINGS } = require('../graphql/queries-additional');
    
    const data = await this.query<any>(GET_USER_SETTINGS, {
      user_id: userId,
    });

    return data.user_settings.map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      key: s.key,
      value: s.value,
      erstellt_am: s.erstellt_am,
      aktualisiert_am: s.aktualisiert_am,
    }));
  }

  async setUserSetting(userId: string, key: string, value: unknown): Promise<UserSettings> {
    // Erst prüfen ob die Einstellung existiert
    const existing = await this.getUserSetting(userId, key);
    
    if (existing) {
      const { UPDATE_USER_SETTING } = require('../graphql/mutations');
      const result = await this.mutate<any>(UPDATE_USER_SETTING, {
        id: existing.id,
        set: { value },
      });
      return result.update_user_settings_by_pk;
    } else {
      const { INSERT_USER_SETTING } = require('../graphql/mutations');
      const result = await this.mutate<any>(INSERT_USER_SETTING, {
        obj: {
          user_id: userId,
          key,
          value,
        },
      });
      return result.insert_user_settings_one;
    }
  }

  async deleteUserSetting(userId: string, key: string): Promise<void> {
    const existing = await this.getUserSetting(userId, key);
    if (existing) {
      const { DELETE_USER_SETTING } = require('../graphql/mutations');
      await this.mutate<any>(DELETE_USER_SETTING, { id: existing.id });
    }
  }

  // ============================================================
  // Aggregationen und Statistiken
  // ============================================================

  async getVerbrauchstypenStats(userId: string): Promise<{
    typ: Verbrauchstyp;
    count: number;
    latestValue?: Verbrauchswert;
  }[]> {
    const typen = await this.getVerbrauchstypen(userId);
    
    return Promise.all(typen.map(async (typ) => {
      const werte = await this.getVerbrauchswerteByTyp(typ.id, { limit: 1, orderBy: 'datum', orderDirection: 'desc' });
      const count = (await this.getVerbrauchswerteByTyp(typ.id)).length;
      
      return {
        typ,
        count,
        latestValue: werte.length > 0 ? werte[0] : undefined,
      };
    }));
  }

  async getVerbrauchStats(userId: string, verbrauchstypId: string, filter: DateRangeFilter): Promise<AggregationResult> {
    // TODO: Implementierung
    throw new Error('Nicht implementiert');
  }

  async getVerbrauchByMonth(userId: string, verbrauchstypId: string, year: number): Promise<{
    month: number;
    verbrauch: number;
    kosten: number;
  }[]> {
    // TODO: Implementierung
    throw new Error('Nicht implementiert');
  }

  // ============================================================
  // Nicht implementierte Methoden (für Handwerker, etc.)
  // ============================================================

  // Diese Methoden müssen noch implementiert werden, wenn sie benötigt werden
  async getAnbieter(userId: string): Promise<Anbieter[]> {
    throw new Error('Nicht implementiert');
  }
  async getAnbieterByTyp(verbrauchstypId: string): Promise<Anbieter[]> {
    throw new Error('Nicht implementiert');
  }
  async getAnbieter(id: string): Promise<Anbieter | null> {
    throw new Error('Nicht implementiert');
  }
  async createAnbieter(data: CreateAnbieter): Promise<Anbieter> {
    throw new Error('Nicht implementiert');
  }
  async updateAnbieter(id: string, data: UpdateAnbieter): Promise<Anbieter> {
    throw new Error('Nicht implementiert');
  }
  async deleteAnbieter(id: string): Promise<void> {
    throw new Error('Nicht implementiert');
  }
  async getVerträge(userId: string): Promise<Vertrag[]> {
    throw new Error('Nicht implementiert');
  }
  async getVerträgeByAnbieter(anbieterId: string): Promise<Vertrag[]> {
    throw new Error('Nicht implementiert');
  }
  async getActiveVerträgeByTyp(verbrauchstypId: string): Promise<Vertrag[]> {
    throw new Error('Nicht implementiert');
  }
  async getVertrag(id: string): Promise<Vertrag | null> {
    throw new Error('Nicht implementiert');
  }
  async createVertrag(data: CreateVertrag): Promise<Vertrag> {
    throw new Error('Nicht implementiert');
  }
  async updateVertrag(id: string, data: UpdateVertrag): Promise<Vertrag> {
    throw new Error('Nicht implementiert');
  }
  async deleteVertrag(id: string): Promise<void> {
    throw new Error('Nicht implementiert');
  }
  async getPreisperiodenByVertrag(vertragId: string): Promise<Preisperiode[]> {
    throw new Error('Nicht implementiert');
  }
  async getCurrentPreisperiode(vertragId: string, date?: string): Promise<Preisperiode | null> {
    throw new Error('Nicht implementiert');
  }
  async getPreisperiode(id: string): Promise<Preisperiode | null> {
    throw new Error('Nicht implementiert');
  }
  async createPreisperiode(data: CreatePreisperiode): Promise<Preisperiode> {
    throw new Error('Nicht implementiert');
  }
  async updatePreisperiode(id: string, data: UpdatePreisperiode): Promise<Preisperiode> {
    throw new Error('Nicht implementiert');
  }
  async deletePreisperiode(id: string): Promise<void> {
    throw new Error('Nicht implementiert');
  }
  async getVerbrauchswerteByStelle(verbrauchsstelleId: string): Promise<Verbrauchswert[]> {
    throw new Error('Nicht implementiert');
  }
  async getVerbrauchswert(id: string): Promise<Verbrauchswert | null> {
    throw new Error('Nicht implementiert');
  }
  async recalculateVerbrauchForTyp(verbrauchstypId: string): Promise<void> {
    throw new Error('Nicht implementiert');
  }
  async getHandwerker(userId: string): Promise<Handwerker[]> {
    throw new Error('Nicht implementiert');
  }
  async getHandwerker(id: string): Promise<Handwerker | null> {
    throw new Error('Nicht implementiert');
  }
  async createHandwerker(data: CreateHandwerker): Promise<Handwerker> {
    throw new Error('Nicht implementiert');
  }
  async updateHandwerker(id: string, data: UpdateHandwerker): Promise<Handwerker> {
    throw new Error('Nicht implementiert');
  }
  async deleteHandwerker(id: string): Promise<void> {
    throw new Error('Nicht implementiert');
  }
  async getHandwerkerrechnungen(userId: string): Promise<Handwerkerrechnung[]> {
    throw new Error('Nicht implementiert');
  }
  async getHandwerkerrechnungenByHandwerker(handwerkerId: string): Promise<Handwerkerrechnung[]> {
    throw new Error('Nicht implementiert');
  }
  async getHandwerkerrechnung(id: string): Promise<Handwerkerrechnung | null> {
    throw new Error('Nicht implementiert');
  }
  async createHandwerkerrechnung(data: CreateHandwerkerrechnung): Promise<Handwerkerrechnung> {
    throw new Error('Nicht implementiert');
  }
  async updateHandwerkerrechnung(id: string, data: UpdateHandwerkerrechnung): Promise<Handwerkerrechnung> {
    throw new Error('Nicht implementiert');
  }
  async deleteHandwerkerrechnung(id: string): Promise<void> {
    throw new Error('Nicht implementiert');
  }
}

export default HasuraDatabaseProvider;
