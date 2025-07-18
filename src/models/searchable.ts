export interface Searchable {
  resolve(id: number): Promise<Suggestion>

  search(query: string): Suggestion[]

  searchAndListing(query: string | null): never
}
