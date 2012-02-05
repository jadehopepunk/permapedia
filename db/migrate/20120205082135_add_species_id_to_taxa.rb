class AddSpeciesIdToTaxa < ActiveRecord::Migration
  def change
    add_column :taxa, :species_id, :integer
    add_foreign_key :taxa, :species
  end
end
