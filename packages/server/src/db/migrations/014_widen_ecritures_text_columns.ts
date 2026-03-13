import type { Knex } from 'knex';

/**
 * Élargit les colonnes textuelles de `ecritures` de VARCHAR(255) à TEXT.
 * Certains FEC réels contiennent des libellés > 255 caractères
 * (ex: prélèvements SEPA avec adresses complètes).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ecritures', (table) => {
    table.text('ecriture_lib').alter();
    table.text('compte_lib').alter();
    table.text('compte_aux_lib').alter();
    table.text('piece_ref').alter();
    table.text('journal_lib').alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ecritures', (table) => {
    table.string('ecriture_lib', 255).alter();
    table.string('compte_lib', 255).alter();
    table.string('compte_aux_lib', 255).alter();
    table.string('piece_ref', 255).alter();
    table.string('journal_lib', 255).alter();
  });
}
