'use client';

import { Component, ReactNode } from 'react';
import { ApolloError } from '@apollo/client';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: ApolloError | Error;
}

export class GraphQLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: ApolloError | Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: ApolloError | Error) {
    console.error('GraphQL Error caught:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  getErrorMessage(): string {
    const { error } = this.state;
    
    if (!error) return 'Ein unbekannter Fehler ist aufgetreten.';
    
    if (error instanceof ApolloError) {
      if (error.networkError) {
        return 'Netzwerkfehler: Bitte überprüfe deine Internetverbindung.';
      }
      if (error.graphQLErrors?.length > 0) {
        return error.graphQLErrors[0].message || 'GraphQL-Fehler beim Laden der Daten.';
      }
    }
    
    return error.message || 'Ein Fehler ist aufgetreten.';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="ht-card max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📡</span>
            </div>
            <h2 className="text-lg font-semibold text-tx-primary mb-2">
              Daten konnten nicht geladen werden
            </h2>
            <p className="text-sm text-tx-secondary mb-6">
              {this.getErrorMessage()}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="ht-btn-primary"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
