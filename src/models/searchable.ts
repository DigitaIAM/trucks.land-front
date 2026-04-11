export interface Searchable {
  resolve(id: number): Promise<Suggestion>

  search(query: string, key: string | undefined): Promise<Suggestion[]>

  searchAndListing(query: string | null): never
}
